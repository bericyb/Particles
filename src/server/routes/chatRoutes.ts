import { Router, Request, Response } from 'express';
import { chatService, ChatMessage } from '../services/chatService';
import { conversationService } from '../services/conversationService';

const router = Router();

// Handler functions
const sendChatMessage = async (req: Request, res: Response) => {
  try {
    const { message, conversationId } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Message is required and must be a string'
      });
    }

    if (!chatService.isConfigured()) {
      return res.status(500).json({
        success: false,
        message: 'Chat service not configured. Please set OPENAI_API_KEY environment variable.'
      });
    }

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await conversationService.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found'
        });
      }
    } else {
      conversation = await conversationService.createConversation(message);
    }

    // Add user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    await conversationService.addMessage(conversation.id, userMessage);

    // Get AI response using context messages (main thread + active branch)
    const contextMessages = await conversationService.getContextMessages(conversation.id);
    const chatResponse = await chatService.sendMessage(contextMessages);

    // Add assistant message
    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: chatResponse.message,
      timestamp: new Date()
    };

    const finalConversation = await conversationService.addMessage(conversation.id, assistantMessage);

    res.json({
      success: true,
      data: {
        conversationId: conversation.id,
        userMessage,
        assistantMessage,
        conversation: finalConversation,
        usage: chatResponse.usage
      }
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
};

const getAllConversations = async (req: Request, res: Response) => {
  try {
    const conversations = await conversationService.getAllConversations();
    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve conversations'
    });
  }
};

const getConversation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const conversation = await conversationService.getConversation(id);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    res.json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve conversation'
    });
  }
};

const createConversation = async (req: Request, res: Response) => {
  try {
    const { title } = req.body;
    const conversation = await conversationService.createConversation(title);
    
    res.json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create conversation'
    });
  }
};

const deleteConversation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = await conversationService.deleteConversation(id);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    res.json({
      success: true,
      message: 'Conversation deleted successfully'
    });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete conversation'
    });
  }
};

// New branch-related handlers
const createBranch = async (req: Request, res: Response) => {
  try {
    const { conversationId, messageIndex, selectedText, parentBranchId } = req.body;

    if (!conversationId || messageIndex === undefined || !selectedText) {
      return res.status(400).json({
        success: false,
        message: 'Conversation ID, message index, and selected text are required'
      });
    }

    const branch = await conversationService.createBranch(
      conversationId,
      messageIndex,
      selectedText,
      parentBranchId || null
    );

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found or invalid message index'
      });
    }

    // Return updated conversation
    const updatedConversation = await conversationService.getConversation(conversationId);

    res.json({
      success: true,
      data: {
        branch,
        conversation: updatedConversation
      }
    });
  } catch (error) {
    console.error('Create branch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create branch'
    });
  }
};

const switchBranch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { branchId } = req.body;

    const conversation = await conversationService.switchBranch(id, branchId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation or branch not found'
      });
    }

    res.json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Switch branch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to switch branch'
    });
  }
};

const mergeBranch = async (req: Request, res: Response) => {
  try {
    const { id, branchId } = req.params;
    const { strategy = 'append' } = req.body;

    const conversation = await conversationService.mergeBranch(id, branchId, strategy);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation or branch not found'
      });
    }

    res.json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Merge branch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to merge branch'
    });
  }
};

const deleteBranch = async (req: Request, res: Response) => {
  try {
    const { id, branchId } = req.params;

    const success = await conversationService.deleteBranch(id, branchId);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Conversation or branch not found'
      });
    }

    // Return updated conversation
    const updatedConversation = await conversationService.getConversation(id);

    res.json({
      success: true,
      data: updatedConversation
    });
  } catch (error) {
    console.error('Delete branch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete branch'
    });
  }
};

const sendInlineQuestion = async (req: Request, res: Response) => {
  try {
    const { question, selectedText, conversationId } = req.body;

    if (!question || !selectedText) {
      return res.status(400).json({
        success: false,
        message: 'Question and selected text are required'
      });
    }

    if (!chatService.isConfigured()) {
      return res.status(500).json({
        success: false,
        message: 'Chat service not configured. Please set OPENAI_API_KEY environment variable.'
      });
    }

    // Create a context-aware prompt for the inline question
    let contextMessages: ChatMessage[] = [];
    
    if (conversationId) {
      contextMessages = await conversationService.getContextMessages(conversationId);
    }

    // Add the inline question with context
    const inlinePrompt = `Based on this selected text: "${selectedText}"

Question: ${question}

Please provide a brief, focused answer to this question about the selected text.`;

    const inlineMessages: ChatMessage[] = [
      ...contextMessages,
      {
        role: 'user',
        content: inlinePrompt,
        timestamp: new Date()
      }
    ];

    const chatResponse = await chatService.sendMessage(inlineMessages);

    res.json({
      success: true,
      data: {
        response: chatResponse.message,
        usage: chatResponse.usage
      }
    });

  } catch (error) {
    console.error('Inline question error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
};

// Routes
router.post('/chat', (req, res, next) => {
  sendChatMessage(req, res).catch(next);
});
router.post('/chat/inline', (req, res, next) => {
  sendInlineQuestion(req, res).catch(next);
});
router.get('/conversations', (req, res, next) => {
  getAllConversations(req, res).catch(next);
});
router.get('/conversations/:id', (req, res, next) => {
  getConversation(req, res).catch(next);
});
router.post('/conversations', (req, res, next) => {
  createConversation(req, res).catch(next);
});
router.delete('/conversations/:id', (req, res, next) => {
  deleteConversation(req, res).catch(next);
});

// New branch routes
router.post('/conversations/:id/branches', (req, res, next) => {
  createBranch(req, res).catch(next);
});
router.put('/conversations/:id/active-branch', (req, res, next) => {
  switchBranch(req, res).catch(next);
});
router.post('/conversations/:id/branches/:branchId/merge', (req, res, next) => {
  mergeBranch(req, res).catch(next);
});
router.delete('/conversations/:id/branches/:branchId', (req, res, next) => {
  deleteBranch(req, res).catch(next);
});

export default router;
