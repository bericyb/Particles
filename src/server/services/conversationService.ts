import fs from 'fs/promises';
import path from 'path';
import { ChatMessage } from './chatService';

export interface ConversationBranch {
  id: string;
  name: string;
  forkPoint: {
    parentId: string | null; // null = main thread, otherwise parent branch ID
    messageIndex: number;    // Index within the parent's messages
    selectedText: string;
    timestamp: Date;
  };
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  color: string; // Unique color for visual identification
  children: string[]; // IDs of child branches
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Main conversation thread
  mainThread: ChatMessage[];
  
  // All branches forked from main thread
  branches: ConversationBranch[];
  
  // Currently active branch (null = main thread)
  activeBranchId: string | null;
}

class ConversationService {
  private conversationsDir = path.join(process.cwd(), 'data', 'conversations');
  private branchColors = [
    '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336',
    '#00BCD4', '#8BC34A', '#FFC107', '#E91E63', '#3F51B5'
  ];

  constructor() {
    this.ensureDirectoryExists();
  }

  private async ensureDirectoryExists(): Promise<void> {
    try {
      await fs.access(this.conversationsDir);
    } catch {
      await fs.mkdir(this.conversationsDir, { recursive: true });
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private generateTitle(firstMessage: string): string {
    // Generate a title from the first message (first 50 characters)
    const title = firstMessage.trim().substring(0, 50);
    return title.length < firstMessage.trim().length ? title + '...' : title;
  }

  private generateBranchName(selectedText: string): string {
    const maxLength = 30;
    const cleanText = selectedText.trim().replace(/\s+/g, ' ');
    if (cleanText.length <= maxLength) {
      return `Fork: ${cleanText}`;
    }
    return `Fork: ${cleanText.substring(0, maxLength - 3)}...`;
  }

  private getNextBranchColor(existingBranches: ConversationBranch[]): string {
    const usedColors = existingBranches.map(b => b.color);
    const availableColors = this.branchColors.filter(color => !usedColors.includes(color));
    return availableColors.length > 0 ? availableColors[0] : this.branchColors[0];
  }

  async createConversation(firstMessage?: string): Promise<Conversation> {
    const id = this.generateId();
    const now = new Date();
    
    const conversation: Conversation = {
      id,
      title: firstMessage ? this.generateTitle(firstMessage) : 'New Conversation',
      createdAt: now,
      updatedAt: now,
      mainThread: [],
      branches: [],
      activeBranchId: null
    };

    await this.saveConversation(conversation);
    return conversation;
  }

  async getConversation(id: string): Promise<Conversation | null> {
    try {
      const filePath = path.join(this.conversationsDir, `${id}.json`);
      const data = await fs.readFile(filePath, 'utf-8');
      const conversation = JSON.parse(data);
      
      // Convert date strings back to Date objects
      conversation.createdAt = new Date(conversation.createdAt);
      conversation.updatedAt = new Date(conversation.updatedAt);
      
      // Convert main thread message timestamps
      conversation.mainThread = conversation.mainThread.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
      
      // Convert branch timestamps and ensure backward compatibility
      conversation.branches = conversation.branches.map((branch: any) => ({
        ...branch,
        createdAt: new Date(branch.createdAt),
        updatedAt: new Date(branch.updatedAt),
        forkPoint: {
          parentId: branch.forkPoint.parentId || null, // Backward compatibility
          messageIndex: branch.forkPoint.messageIndex,
          selectedText: branch.forkPoint.selectedText,
          timestamp: new Date(branch.forkPoint.timestamp)
        },
        messages: branch.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })),
        children: branch.children || [] // Backward compatibility
      }));
      
      return conversation;
    } catch {
      return null;
    }
  }

  async getAllConversations(): Promise<Conversation[]> {
    try {
      const files = await fs.readdir(this.conversationsDir);
      const conversations: Conversation[] = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const id = file.replace('.json', '');
          const conversation = await this.getConversation(id);
          if (conversation) {
            conversations.push(conversation);
          }
        }
      }

      // Sort by updatedAt descending (most recent first)
      return conversations.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    } catch {
      return [];
    }
  }

  async addMessage(conversationId: string, message: ChatMessage): Promise<Conversation | null> {
    const conversation = await this.getConversation(conversationId);
    if (!conversation) {
      return null;
    }

    // Add message to active branch or main thread
    if (conversation.activeBranchId) {
      const branch = conversation.branches.find(b => b.id === conversation.activeBranchId);
      if (branch) {
        branch.messages.push(message);
        branch.updatedAt = new Date();
      }
    } else {
      conversation.mainThread.push(message);
    }

    conversation.updatedAt = new Date();

    // Update title if this is the first user message in main thread
    if (conversation.mainThread.length === 1 && message.role === 'user' && !conversation.activeBranchId) {
      conversation.title = this.generateTitle(message.content);
    }

    await this.saveConversation(conversation);
    return conversation;
  }

  async createBranch(conversationId: string, messageIndex: number, selectedText: string, parentBranchId: string | null = null): Promise<ConversationBranch | null> {
    const conversation = await this.getConversation(conversationId);
    if (!conversation) {
      return null;
    }

    // Validate message index based on parent context
    let parentMessages: ChatMessage[];
    if (parentBranchId) {
      const parentBranch = conversation.branches.find(b => b.id === parentBranchId);
      if (!parentBranch) {
        return null;
      }
      // Get full context messages for the parent branch
      parentMessages = await this.getContextMessages(conversationId);
    } else {
      parentMessages = conversation.mainThread;
    }

    // Allow branching from empty conversations (messageIndex can be 0 for empty)
    // or from valid message indices
    if (messageIndex < 0 || (parentMessages.length > 0 && messageIndex >= parentMessages.length)) {
      return null;
    }

    const branchId = this.generateId();
    const now = new Date();
    
    const newBranch: ConversationBranch = {
      id: branchId,
      name: this.generateBranchName(selectedText),
      forkPoint: {
        parentId: parentBranchId,
        messageIndex,
        selectedText,
        timestamp: now
      },
      messages: [],
      createdAt: now,
      updatedAt: now,
      color: this.getNextBranchColor(conversation.branches),
      children: []
    };

    // Add this branch as a child to its parent
    if (parentBranchId) {
      const parentBranch = conversation.branches.find(b => b.id === parentBranchId);
      if (parentBranch) {
        parentBranch.children.push(branchId);
      }
    }

    conversation.branches.push(newBranch);
    conversation.activeBranchId = branchId; // Switch to new branch
    conversation.updatedAt = now;

    await this.saveConversation(conversation);
    return newBranch;
  }

  async switchBranch(conversationId: string, branchId: string | null): Promise<Conversation | null> {
    const conversation = await this.getConversation(conversationId);
    if (!conversation) {
      return null;
    }

    // Validate branch exists (if not switching to main thread)
    if (branchId && !conversation.branches.find(b => b.id === branchId)) {
      return null;
    }

    conversation.activeBranchId = branchId;
    conversation.updatedAt = new Date();

    await this.saveConversation(conversation);
    return conversation;
  }

  async mergeBranch(conversationId: string, branchId: string, strategy: 'append' | 'insert' = 'append'): Promise<Conversation | null> {
    const conversation = await this.getConversation(conversationId);
    if (!conversation) {
      return null;
    }

    const branch = conversation.branches.find(b => b.id === branchId);
    if (!branch) {
      return null;
    }

    // Determine where to merge: parent branch or main thread
    if (branch.forkPoint.parentId === null) {
      // Merge into main thread
      if (strategy === 'append') {
        conversation.mainThread.push(...branch.messages);
      } else if (strategy === 'insert') {
        // Insert at fork point + 1
        const insertIndex = branch.forkPoint.messageIndex + 1;
        conversation.mainThread.splice(insertIndex, 0, ...branch.messages);
      }
    } else {
      // Merge into parent branch
      const parentBranch = conversation.branches.find(b => b.id === branch.forkPoint.parentId);
      if (!parentBranch) {
        return null; // Parent branch not found
      }

      if (strategy === 'append') {
        parentBranch.messages.push(...branch.messages);
      } else if (strategy === 'insert') {
        // For nested branches, we need to calculate the correct insertion point
        // within the parent branch's messages
        const insertIndex = Math.min(branch.forkPoint.messageIndex + 1, parentBranch.messages.length);
        parentBranch.messages.splice(insertIndex, 0, ...branch.messages);
      }
      
      parentBranch.updatedAt = new Date();
    }

    // Handle child branches - they need to be re-parented
    const childBranches = conversation.branches.filter(b => b.forkPoint.parentId === branchId);
    for (const childBranch of childBranches) {
      // Re-parent child branches to the merged branch's parent
      childBranch.forkPoint.parentId = branch.forkPoint.parentId;
      
      // Add to new parent's children array
      if (branch.forkPoint.parentId) {
        const newParent = conversation.branches.find(b => b.id === branch.forkPoint.parentId);
        if (newParent && !newParent.children.includes(childBranch.id)) {
          newParent.children.push(childBranch.id);
        }
      }
    }

    // Remove this branch from its parent's children array AFTER re-parenting
    if (branch.forkPoint.parentId) {
      const parentBranch = conversation.branches.find(b => b.id === branch.forkPoint.parentId);
      if (parentBranch) {
        parentBranch.children = parentBranch.children.filter(childId => childId !== branchId);
      }
    }

    // Clean up any references to this branch in all branches' children arrays BEFORE removing the branch
    conversation.branches.forEach(otherBranch => {
      otherBranch.children = otherBranch.children.filter(childId => childId !== branchId);
    });

    // Remove the merged branch from the branches array AFTER cleanup
    conversation.branches = conversation.branches.filter(b => b.id !== branchId);
    
    // Switch to parent branch if we were on the merged branch
    if (conversation.activeBranchId === branchId) {
      conversation.activeBranchId = branch.forkPoint.parentId; // null for main thread
    }

    conversation.updatedAt = new Date();
    await this.saveConversation(conversation);
    return conversation;
  }

  async deleteBranch(conversationId: string, branchId: string): Promise<boolean> {
    const conversation = await this.getConversation(conversationId);
    if (!conversation) {
      return false;
    }

    const branch = conversation.branches.find(b => b.id === branchId);
    if (!branch) {
      return false;
    }

    // Remove this branch from its parent's children array
    if (branch.forkPoint.parentId) {
      const parentBranch = conversation.branches.find(b => b.id === branch.forkPoint.parentId);
      if (parentBranch) {
        parentBranch.children = parentBranch.children.filter(childId => childId !== branchId);
      }
    }

    // Handle child branches - re-parent them to the deleted branch's parent
    const childBranches = conversation.branches.filter(b => b.forkPoint.parentId === branchId);
    for (const childBranch of childBranches) {
      // Re-parent child branches to the deleted branch's parent
      childBranch.forkPoint.parentId = branch.forkPoint.parentId;
      
      // Add to new parent's children array
      if (branch.forkPoint.parentId) {
        const newParent = conversation.branches.find(b => b.id === branch.forkPoint.parentId);
        if (newParent && !newParent.children.includes(childBranch.id)) {
          newParent.children.push(childBranch.id);
        }
      }
    }

    // Remove the branch
    conversation.branches = conversation.branches.filter(b => b.id !== branchId);
    
    // Switch to parent branch if we were on the deleted branch
    if (conversation.activeBranchId === branchId) {
      conversation.activeBranchId = branch.forkPoint.parentId; // null for main thread
    }

    conversation.updatedAt = new Date();
    await this.saveConversation(conversation);
    return true;
  }

  async deleteConversation(id: string): Promise<boolean> {
    try {
      const filePath = path.join(this.conversationsDir, `${id}.json`);
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }

  // Get messages for current context (builds full path from root to active branch)
  async getContextMessages(conversationId: string): Promise<ChatMessage[]> {
    const conversation = await this.getConversation(conversationId);
    if (!conversation) {
      return [];
    }

    if (!conversation.activeBranchId) {
      // Return main thread messages
      return conversation.mainThread;
    }

    return this.buildBranchPath(conversation, conversation.activeBranchId);
  }

  // Build the complete message path from root to a specific branch
  private buildBranchPath(conversation: Conversation, branchId: string): ChatMessage[] {
    const branch = conversation.branches.find(b => b.id === branchId);
    if (!branch) {
      return conversation.mainThread;
    }

    let messages: ChatMessage[] = [];

    if (branch.forkPoint.parentId === null) {
      // Branch from main thread
      messages = conversation.mainThread.slice(0, branch.forkPoint.messageIndex + 1);
    } else {
      // Branch from another branch - recursively build parent path
      const parentPath = this.buildBranchPath(conversation, branch.forkPoint.parentId);
      messages = parentPath.slice(0, branch.forkPoint.messageIndex + 1);
    }

    // Add this branch's messages
    return [...messages, ...branch.messages];
  }

  // Get all branches that are children of a specific branch (or main thread if parentId is null)
  getBranchChildren(conversation: Conversation, parentId: string | null): ConversationBranch[] {
    return conversation.branches.filter(branch => branch.forkPoint.parentId === parentId);
  }

  // Get the depth level of a branch (0 = main thread children, 1 = second level, etc.)
  getBranchDepth(conversation: Conversation, branchId: string): number {
    const branch = conversation.branches.find(b => b.id === branchId);
    if (!branch || branch.forkPoint.parentId === null) {
      return 0;
    }

    return 1 + this.getBranchDepth(conversation, branch.forkPoint.parentId);
  }

  // Get the full path of branch IDs from root to a specific branch
  getBranchPath(conversation: Conversation, branchId: string): string[] {
    const branch = conversation.branches.find(b => b.id === branchId);
    if (!branch) {
      return [];
    }

    if (branch.forkPoint.parentId === null) {
      return [branchId];
    }

    const parentPath = this.getBranchPath(conversation, branch.forkPoint.parentId);
    return [...parentPath, branchId];
  }

  private async saveConversation(conversation: Conversation): Promise<void> {
    const filePath = path.join(this.conversationsDir, `${conversation.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(conversation, null, 2));
  }
}

export const conversationService = new ConversationService();
