class ChatInterface {
  constructor() {
    this.currentConversationId = null;
    this.currentConversation = null;
    this.conversations = [];
    this.isLoading = false;
    this.currentSelection = null;
    this.selectedBranchId = null; // For context menu
    
    this.initializeElements();
    this.attachEventListeners();
    this.loadConversations();
    this.setupTextareaAutoResize();
    this.setupTextSelection();
  }

  initializeElements() {
    // Main elements
    this.sidebar = document.getElementById('sidebar');
    this.conversationList = document.getElementById('conversationList');
    this.branchPanel = document.getElementById('branchPanel');
    this.branchTree = document.getElementById('branchTree');
    this.messagesContainer = document.getElementById('messagesContainer');
    this.chatInput = document.getElementById('chatInput');
    this.sendBtn = document.getElementById('sendBtn');
    this.chatTitle = document.getElementById('chatTitle');
    this.activeBranchIndicator = document.getElementById('activeBranchIndicator');
    
    // Control buttons
    this.newChatBtn = document.getElementById('newChatBtn');
    this.toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
    this.collapseBranchesBtn = document.getElementById('collapseBranchesBtn');
    this.expandBranchesBtn = document.getElementById('expandBranchesBtn');
    
    // Selection popup elements
    this.selectionPopup = document.getElementById('selectionPopup');
    this.createBranchBtn = document.getElementById('createBranchBtn');
    this.askInlineBtn = document.getElementById('askInlineBtn');
    this.cancelSelectionBtn = document.getElementById('cancelSelectionBtn');
    this.selectedTextPreview = document.getElementById('selectedTextPreview');
    this.popupInput = document.getElementById('popupInput');
    this.popupTextarea = document.getElementById('popupTextarea');
    this.confirmPopupBtn = document.getElementById('confirmPopupBtn');
    this.cancelPopupBtn = document.getElementById('cancelPopupBtn');
    
    // Context menu
    this.branchContextMenu = document.getElementById('branchContextMenu');
    this.switchToBranchBtn = document.getElementById('switchToBranchBtn');
    this.mergeBranchBtn = document.getElementById('mergeBranchBtn');
    this.renameBranchBtn = document.getElementById('renameBranchBtn');
    this.deleteBranchBtn = document.getElementById('deleteBranchBtn');
    
    // Merge modal
    this.mergeModal = document.getElementById('mergeModal');
    this.closeMergeModal = document.getElementById('closeMergeModal');
    this.confirmMergeBtn = document.getElementById('confirmMergeBtn');
    this.cancelMergeBtn = document.getElementById('cancelMergeBtn');
    
    // Template
    this.inlineQuestionTemplate = document.getElementById('inlineQuestionTemplate');
  }

  attachEventListeners() {
    // Send message
    this.sendBtn.addEventListener('click', () => this.sendMessage());
    this.chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Input validation
    this.chatInput.addEventListener('input', () => {
      const hasText = this.chatInput.value.trim().length > 0;
      this.sendBtn.disabled = !hasText || this.isLoading;
    });

    // Controls
    this.newChatBtn.addEventListener('click', () => this.startNewConversation());
    this.toggleSidebarBtn.addEventListener('click', () => this.toggleSidebar());
    this.collapseBranchesBtn.addEventListener('click', () => this.collapseBranches());
    this.expandBranchesBtn.addEventListener('click', () => this.expandBranches());

    // Selection popup
    this.createBranchBtn.addEventListener('click', () => this.handleCreateBranch());
    this.askInlineBtn.addEventListener('click', () => this.handleAskInline());
    this.cancelSelectionBtn.addEventListener('click', () => this.hideSelectionPopup());
    this.confirmPopupBtn.addEventListener('click', () => this.confirmPopupAction());
    this.cancelPopupBtn.addEventListener('click', () => this.cancelPopupAction());

    // Context menu
    this.switchToBranchBtn.addEventListener('click', () => this.switchToBranch());
    this.mergeBranchBtn.addEventListener('click', () => this.showMergeModal());
    this.renameBranchBtn.addEventListener('click', () => this.renameBranch());
    this.deleteBranchBtn.addEventListener('click', () => this.deleteBranch());

    // Merge modal
    this.closeMergeModal.addEventListener('click', () => this.hideMergeModal());
    this.confirmMergeBtn.addEventListener('click', () => this.confirmMerge());
    this.cancelMergeBtn.addEventListener('click', () => this.hideMergeModal());

    // Hide popups when clicking outside
    document.addEventListener('click', (e) => {
      // Don't interfere with input elements
      if (e.target.closest('#chatInput') || e.target.closest('.input-area')) {
        return;
      }
      
      if (!this.selectionPopup.contains(e.target) && !e.target.closest('.message-content')) {
        this.hideSelectionPopup();
      }
      if (!this.branchContextMenu.contains(e.target) && !e.target.closest('.branch-node')) {
        this.hideBranchContextMenu();
      }
    });

    // Hide popups on scroll
    this.messagesContainer.addEventListener('scroll', () => {
      this.hideSelectionPopup();
      this.hideBranchContextMenu();
    });
  }

  setupTextareaAutoResize() {
    this.chatInput.addEventListener('input', () => {
      this.chatInput.style.height = 'auto';
      this.chatInput.style.height = Math.min(this.chatInput.scrollHeight, 120) + 'px';
    });
  }

  async loadConversations() {
    try {
      const response = await fetch('/api/conversations');
      const data = await response.json();
      
      if (data.success) {
        this.conversations = data.data;
        this.renderConversationList();
      } else {
        console.error('Failed to load conversations:', data.message);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  }

  renderConversationList() {
    this.conversationList.innerHTML = '';
    
    if (this.conversations.length === 0) {
      this.conversationList.innerHTML = '<div class="text-center text-muted p-2">No conversations yet</div>';
      return;
    }

    this.conversations.forEach(conversation => {
      const item = document.createElement('div');
      item.className = 'conversation-item';
      if (conversation.id === this.currentConversationId) {
        item.classList.add('active');
      }

      const date = new Date(conversation.updatedAt).toLocaleDateString();
      
      item.innerHTML = `
        <div class="conversation-title">${this.escapeHtml(conversation.title)}</div>
        <div class="conversation-date">${date}</div>
        <button class="conversation-delete" onclick="chatInterface.deleteConversation('${conversation.id}', event)">×</button>
      `;

      item.addEventListener('click', (e) => {
        if (!e.target.classList.contains('conversation-delete')) {
          this.loadConversation(conversation.id);
        }
      });

      this.conversationList.appendChild(item);
    });
  }

  async loadConversation(conversationId) {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`);
      const data = await response.json();
      
      if (data.success) {
        this.currentConversationId = conversationId;
        this.currentConversation = data.data;
        this.chatTitle.textContent = data.data.title;
        this.renderBranchTree();
        this.renderMessages();
        this.updateActiveBranchIndicator();
        this.renderConversationList(); // Update active state
      } else {
        this.showError('Failed to load conversation');
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      this.showError('Error loading conversation');
    }
  }

  renderBranchTree() {
    if (!this.currentConversation) {
      this.branchTree.innerHTML = '<div class="text-center text-muted p-2">No conversation loaded</div>';
      return;
    }

    this.branchTree.innerHTML = '';

    // Main thread node
    const mainNode = this.createBranchNode({
      id: null,
      name: 'Main Thread',
      isMain: true,
      messageCount: this.currentConversation.mainThread.length,
      isActive: this.currentConversation.activeBranchId === null,
      depth: 0
    });
    this.branchTree.appendChild(mainNode);

    // Render branches in tree structure
    this.renderBranchChildren(null, 0);
  }

  renderBranchChildren(parentId, depth) {
    const children = this.currentConversation.branches.filter(branch => 
      branch.forkPoint.parentId === parentId
    );

    children.forEach(branch => {
      const branchNode = this.createBranchNode({
        id: branch.id,
        name: branch.name,
        color: branch.color,
        messageCount: branch.messages.length,
        forkPoint: branch.forkPoint.messageIndex,
        isActive: this.currentConversation.activeBranchId === branch.id,
        depth: depth + 1,
        parentId: branch.forkPoint.parentId
      });
      this.branchTree.appendChild(branchNode);

      // Recursively render children of this branch
      this.renderBranchChildren(branch.id, depth + 1);
    });
  }

  createBranchNode(nodeData) {
    const node = document.createElement('div');
    node.className = 'branch-node';
    if (nodeData.isMain) node.classList.add('main-thread');
    if (nodeData.isActive) node.classList.add('active');

    // Add indentation for nested branches
    if (nodeData.depth > 0) {
      node.style.paddingLeft = `${20 + (nodeData.depth * 16)}px`;
      node.classList.add('nested-branch');
    }

    const dot = document.createElement('span');
    dot.className = 'branch-dot';
    if (nodeData.isMain) {
      dot.classList.add('main');
    } else {
      dot.style.backgroundColor = nodeData.color;
    }

    const name = document.createElement('span');
    name.className = 'branch-name';
    name.textContent = nodeData.name;

    const info = document.createElement('span');
    info.className = 'branch-info';
    info.textContent = `${nodeData.messageCount} msgs`;
    if (!nodeData.isMain) {
      info.textContent += ` @${nodeData.forkPoint}`;
    }

    // Add depth indicator for nested branches
    if (nodeData.depth > 0) {
      const depthIndicator = document.createElement('span');
      depthIndicator.className = 'depth-indicator';
      depthIndicator.textContent = `L${nodeData.depth}`;
      depthIndicator.style.fontSize = '10px';
      depthIndicator.style.opacity = '0.6';
      depthIndicator.style.marginLeft = '4px';
      info.appendChild(depthIndicator);
    }

    node.appendChild(dot);
    node.appendChild(name);
    node.appendChild(info);

    // Click handler
    node.addEventListener('click', () => {
      this.switchToThread(nodeData.id);
    });

    // Right-click context menu (only for branches)
    if (!nodeData.isMain) {
      node.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.showBranchContextMenu(e, nodeData.id);
      });
    }

    return node;
  }

  async switchToThread(branchId) {
    if (!this.currentConversationId) return;

    try {
      const response = await fetch(`/api/conversations/${this.currentConversationId}/active-branch`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchId })
      });

      const data = await response.json();
      if (data.success) {
        this.currentConversation = data.data;
        this.renderBranchTree();
        this.renderMessages();
        this.updateActiveBranchIndicator();
      } else {
        this.showError('Failed to switch branch');
      }
    } catch (error) {
      console.error('Error switching branch:', error);
      this.showError('Error switching branch');
    }
  }

  renderMessages() {
    if (!this.currentConversation) {
      this.messagesContainer.innerHTML = '<div class="welcome-message"><p>No conversation loaded</p></div>';
      return;
    }

    // Get context messages (main thread + active branch)
    const contextMessages = this.getContextMessages();
    
    this.messagesContainer.innerHTML = '';
    
    if (contextMessages.length === 0) {
      this.messagesContainer.innerHTML = '<div class="welcome-message"><p>Start the conversation by typing a message below.</p></div>';
      return;
    }

    contextMessages.forEach((message, index) => {
      this.addMessageToChat(message.role, message.content, new Date(message.timestamp), false, index);
    });

    this.scrollToBottom();
  }

  getContextMessages() {
    if (!this.currentConversation) return [];

    if (!this.currentConversation.activeBranchId) {
      return this.currentConversation.mainThread;
    }

    return this.buildBranchPath(this.currentConversation.activeBranchId);
  }

  // Build the complete message path from root to a specific branch
  buildBranchPath(branchId) {
    const branch = this.currentConversation.branches.find(b => b.id === branchId);
    if (!branch) {
      return this.currentConversation.mainThread;
    }

    let messages = [];

    if (branch.forkPoint.parentId === null) {
      // Branch from main thread
      messages = this.currentConversation.mainThread.slice(0, branch.forkPoint.messageIndex + 1);
    } else {
      // Branch from another branch - recursively build parent path
      const parentPath = this.buildBranchPath(branch.forkPoint.parentId);
      messages = parentPath.slice(0, branch.forkPoint.messageIndex + 1);
    }

    // Add this branch's messages
    return [...messages, ...branch.messages];
  }

  addMessageToChat(role, content, timestamp, animate = true, messageIndex = -1) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    messageDiv.dataset.messageIndex = messageIndex;
    
    const timeStr = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageDiv.innerHTML = `
      <div class="message-content">
        ${this.escapeHtml(content).replace(/\n/g, '<br>')}
        <div class="message-time">${timeStr}</div>
      </div>
    `;

    if (animate) {
      messageDiv.style.opacity = '0';
      messageDiv.style.transform = 'translateY(20px)';
    }

    this.messagesContainer.appendChild(messageDiv);

    if (animate) {
      requestAnimationFrame(() => {
        messageDiv.style.transition = 'all 0.3s ease';
        messageDiv.style.opacity = '1';
        messageDiv.style.transform = 'translateY(0)';
      });
    }

    this.scrollToBottom();
  }

  updateActiveBranchIndicator() {
    if (!this.currentConversation) return;

    const dot = this.activeBranchIndicator.querySelector('.branch-dot');
    const name = this.activeBranchIndicator.querySelector('.branch-name');

    if (!this.currentConversation.activeBranchId) {
      dot.style.backgroundColor = '#2196F3';
      name.textContent = 'Main Thread';
    } else {
      const branch = this.currentConversation.branches.find(b => b.id === this.currentConversation.activeBranchId);
      if (branch) {
        dot.style.backgroundColor = branch.color;
        name.textContent = branch.name;
      }
    }
  }

  // Text Selection Methods
  setupTextSelection() {
    this.messagesContainer.addEventListener('mouseup', (e) => this.handleTextSelection(e));
  }

  handleTextSelection(event) {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (selectedText.length === 0) {
      this.hideSelectionPopup();
      return;
    }

    const messageElement = event.target.closest('.message');
    if (!messageElement) {
      this.hideSelectionPopup();
      return;
    }

    const messageIndex = parseInt(messageElement.dataset.messageIndex);
    if (messageIndex === -1 || isNaN(messageIndex)) {
      this.hideSelectionPopup();
      return;
    }

    this.currentSelection = {
      text: selectedText,
      messageElement: messageElement,
      messageIndex: messageIndex
    };

    this.showSelectionPopup(event);
  }

  showSelectionPopup(event) {
    const previewText = this.currentSelection.text.length > 30 
      ? this.currentSelection.text.substring(0, 30) + '...'
      : this.currentSelection.text;
    this.selectedTextPreview.textContent = previewText;
    
    this.popupInput.classList.add('hidden');
    this.popupTextarea.value = '';
    
    this.selectionPopup.classList.remove('hidden');
    
    const rect = window.getSelection().getRangeAt(0).getBoundingClientRect();
    const containerRect = this.messagesContainer.getBoundingClientRect();
    
    const popupX = rect.left + (rect.width / 2) - (this.selectionPopup.offsetWidth / 2);
    const popupY = rect.top - this.selectionPopup.offsetHeight - 15;
    
    const adjustedX = Math.max(containerRect.left + 10, Math.min(popupX, containerRect.right - this.selectionPopup.offsetWidth - 10));
    const adjustedY = Math.max(containerRect.top + 10, popupY);
    
    this.selectionPopup.style.left = `${adjustedX}px`;
    this.selectionPopup.style.top = `${adjustedY}px`;
  }

  hideSelectionPopup() {
    this.selectionPopup.classList.add('hidden');
    this.currentSelection = null;
    window.getSelection().removeAllRanges();
  }

  handleCreateBranch() {
    this.popupInput.classList.remove('hidden');
    this.popupTextarea.placeholder = 'Enter a question or comment for this branch...';
    this.popupTextarea.focus();
    this.currentPopupAction = 'createBranch';
  }

  handleAskInline() {
    this.popupInput.classList.remove('hidden');
    this.popupTextarea.placeholder = 'What would you like to know about this text?';
    this.popupTextarea.focus();
    this.currentPopupAction = 'askInline';
  }

  async confirmPopupAction() {
    if (!this.currentSelection) return;

    const inputText = this.popupTextarea.value.trim();

    if (this.currentPopupAction === 'createBranch') {
      await this.createBranch(inputText);
    } else if (this.currentPopupAction === 'askInline') {
      if (!inputText) {
        this.showError('Please enter a question');
        return;
      }
      await this.sendInlineQuestion(inputText);
    }

    this.hideSelectionPopup();
  }

  cancelPopupAction() {
    this.popupInput.classList.add('hidden');
    this.currentPopupAction = null;
  }

  async createBranch(initialMessage = '') {
    if (!this.currentSelection || !this.currentConversationId) return;

    try {
      const response = await fetch(`/api/conversations/${this.currentConversationId}/branches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: this.currentConversationId,
          messageIndex: this.currentSelection.messageIndex,
          selectedText: this.currentSelection.text,
          parentBranchId: this.currentConversation.activeBranchId // Pass current active branch as parent
        })
      });

      const data = await response.json();
      if (data.success) {
        this.currentConversation = data.data.conversation;
        this.renderBranchTree();
        this.renderMessages();
        this.updateActiveBranchIndicator();

        // If there's an initial message, send it
        if (initialMessage) {
          setTimeout(() => {
            this.chatInput.value = initialMessage;
            this.sendMessage();
          }, 500);
        }
      } else {
        this.showError('Failed to create branch');
      }
    } catch (error) {
      console.error('Error creating branch:', error);
      this.showError('Error creating branch');
    }
  }

  async sendInlineQuestion(question) {
    if (!this.currentSelection) return;

    const messageElement = this.currentSelection.messageElement;
    const selectedText = this.currentSelection.text;

    // Create inline question container
    const inlineContainer = document.createElement('div');
    inlineContainer.className = 'inline-question-container';
    inlineContainer.innerHTML = `
      <div class="inline-question-header">
        <span class="inline-question-label">Question: ${this.escapeHtml(question)}</span>
        <button class="inline-question-close">×</button>
      </div>
      <div class="inline-question-response">
        <div class="inline-response-content"></div>
      </div>
    `;

    const closeBtn = inlineContainer.querySelector('.inline-question-close');
    closeBtn.addEventListener('click', () => inlineContainer.remove());

    messageElement.appendChild(inlineContainer);

    const responseContent = inlineContainer.querySelector('.inline-response-content');

    // Show loading
    responseContent.innerHTML = `
      <div class="inline-question-loading">
        <div class="typing-dots">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
        <span>Thinking...</span>
      </div>
    `;

    try {
      const response = await fetch('/api/chat/inline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question,
          selectedText: selectedText,
          conversationId: this.currentConversationId
        })
      });

      const data = await response.json();
      if (data.success) {
        responseContent.innerHTML = this.escapeHtml(data.data.response).replace(/\n/g, '<br>');
      } else {
        responseContent.innerHTML = `<span style="color: #e74c3c;">Error: ${data.message || 'Failed to get response'}</span>`;
      }
    } catch (error) {
      console.error('Error sending inline question:', error);
      responseContent.innerHTML = `<span style="color: #e74c3c;">Network error. Please try again.</span>`;
    }
  }

  // Branch Context Menu
  showBranchContextMenu(event, branchId) {
    this.selectedBranchId = branchId;
    this.branchContextMenu.classList.remove('hidden');
    
    const x = Math.min(event.clientX, window.innerWidth - this.branchContextMenu.offsetWidth - 10);
    const y = Math.min(event.clientY, window.innerHeight - this.branchContextMenu.offsetHeight - 10);
    
    this.branchContextMenu.style.left = `${x}px`;
    this.branchContextMenu.style.top = `${y}px`;
  }

  hideBranchContextMenu() {
    this.branchContextMenu.classList.add('hidden');
    this.selectedBranchId = null;
  }

  async switchToBranch() {
    if (this.selectedBranchId) {
      await this.switchToThread(this.selectedBranchId);
    }
    this.hideBranchContextMenu();
  }

  showMergeModal() {
    // Store the selected branch ID before hiding the context menu
    const branchIdToMerge = this.selectedBranchId;
    
    this.mergeModal.classList.remove('hidden');
    this.hideBranchContextMenu();
    
    // Restore the selected branch ID for the merge operation
    this.selectedBranchId = branchIdToMerge;
  }

  hideMergeModal() {
    this.mergeModal.classList.add('hidden');
    // Clear selectedBranchId when modal is manually closed
    this.selectedBranchId = null;
  }

  closeMergeModalAfterSuccess() {
    // Hide modal after successful merge without clearing selectedBranchId
    this.mergeModal.classList.add('hidden');
  }

  async confirmMerge() {
    if (!this.selectedBranchId || !this.currentConversationId) {
      return;
    }

    const strategyElement = document.querySelector('input[name="mergeStrategy"]:checked');
    
    if (!strategyElement) {
      this.showError('Please select a merge strategy');
      return;
    }
    
    const strategy = strategyElement.value;

    try {
      const response = await fetch(`/api/conversations/${this.currentConversationId}/branches/${this.selectedBranchId}/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy })
      });

      const data = await response.json();
      
      if (data.success) {
        this.currentConversation = data.data;
        this.renderBranchTree();
        this.renderMessages();
        this.updateActiveBranchIndicator();
        this.closeMergeModalAfterSuccess();
      } else {
        this.showError('Failed to merge branch: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error merging branch:', error);
      this.showError('Error merging branch: ' + error.message);
    }
  }

  async renameBranch() {
    // TODO: Implement branch renaming
    this.hideBranchContextMenu();
  }

  async deleteBranch() {
    if (!this.selectedBranchId || !this.currentConversationId) return;

    if (!confirm('Are you sure you want to delete this branch?')) {
      this.hideBranchContextMenu();
      return;
    }

    try {
      const response = await fetch(`/api/conversations/${this.currentConversationId}/branches/${this.selectedBranchId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        this.currentConversation = data.data;
        this.renderBranchTree();
        this.renderMessages();
        this.updateActiveBranchIndicator();
      } else {
        this.showError('Failed to delete branch');
      }
    } catch (error) {
      console.error('Error deleting branch:', error);
      this.showError('Error deleting branch');
    }

    this.hideBranchContextMenu();
  }

  // Message sending
  async sendMessage() {
    const message = this.chatInput.value.trim();
    if (!message || this.isLoading) return;

    this.isLoading = true;
    this.sendBtn.disabled = true;
    this.chatInput.disabled = true;

    // Clear welcome message if present
    const welcomeMessage = this.messagesContainer.querySelector('.welcome-message');
    if (welcomeMessage) {
      welcomeMessage.remove();
    }

    // Add user message to chat
    this.addMessageToChat('user', message, new Date());
    this.chatInput.value = '';
    this.chatInput.style.height = 'auto';

    // Show typing indicator
    this.showTypingIndicator();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message,
          conversationId: this.currentConversationId
        })
      });

      const data = await response.json();
      this.hideTypingIndicator();

      if (data.success) {
        // Update current conversation ID if this was a new conversation
        if (!this.currentConversationId) {
          this.currentConversationId = data.data.conversationId;
          this.currentConversation = data.data.conversation;
          this.chatTitle.textContent = data.data.conversation.title;
          this.renderBranchTree();
          this.updateActiveBranchIndicator();
        } else {
          this.currentConversation = data.data.conversation;
        }

        // Add assistant response
        this.addMessageToChat('assistant', data.data.assistantMessage.content, new Date(data.data.assistantMessage.timestamp));

        // Reload conversations to update the sidebar
        await this.loadConversations();
      } else {
        this.showError(data.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      this.hideTypingIndicator();
      this.showError('Network error. Please try again.');
    } finally {
      this.isLoading = false;
      this.sendBtn.disabled = false;
      this.chatInput.disabled = false;
      this.chatInput.focus();
    }
  }

  showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.id = 'typingIndicator';
    
    typingDiv.innerHTML = `
      <div class="typing-dots">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
      <span>AI is typing...</span>
    `;

    this.messagesContainer.appendChild(typingDiv);
    this.scrollToBottom();
  }

  hideTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }

  // Utility methods
  async startNewConversation() {
    this.currentConversationId = null;
    this.currentConversation = null;
    this.chatTitle.textContent = 'New Conversation';
    this.messagesContainer.innerHTML = '<div class="welcome-message"><p>Welcome! Start a conversation by typing a message below.</p></div>';
    this.branchTree.innerHTML = '<div class="text-center text-muted p-2">Start a conversation to see branches</div>';
    this.activeBranchIndicator.querySelector('.branch-dot').style.backgroundColor = '#2196F3';
    this.activeBranchIndicator.querySelector('.branch-name').textContent = 'Main Thread';
    this.renderConversationList();
    
    // Ensure input is properly focused
    setTimeout(() => {
      this.chatInput.focus();
    }, 100);
  }

  async deleteConversation(conversationId, event) {
    event.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this conversation?')) {
      return;
    }

    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        if (conversationId === this.currentConversationId) {
          this.startNewConversation();
        }
        await this.loadConversations();
      } else {
        this.showError('Failed to delete conversation');
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      this.showError('Error deleting conversation');
    }
  }

  toggleSidebar() {
    this.sidebar.classList.toggle('collapsed');
  }

  collapseBranches() {
    // TODO: Implement branch collapsing
  }

  expandBranches() {
    // TODO: Implement branch expanding
  }

  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
      ${message}
      <button class="retry-btn" onclick="this.parentElement.remove()">Dismiss</button>
    `;

    this.messagesContainer.appendChild(errorDiv);
    this.scrollToBottom();

    setTimeout(() => {
      if (errorDiv.parentElement) {
        errorDiv.remove();
      }
    }, 5000);
  }

  scrollToBottom() {
    requestAnimationFrame(() => {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize the chat interface when the page loads
let chatInterface;
document.addEventListener('DOMContentLoaded', () => {
  chatInterface = new ChatInterface();
});

// Make chatInterface globally available for event handlers
window.chatInterface = chatInterface;
