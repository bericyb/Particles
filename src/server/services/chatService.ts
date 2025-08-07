import OpenAI from 'openai';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ChatResponse {
  message: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

class ChatService {
  private openai: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey: apiKey,
      });
    } else {
      console.warn('OPENAI_API_KEY not found in environment variables');
    }
  }

  async sendMessage(messages: ChatMessage[]): Promise<ChatResponse> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized. Please set OPENAI_API_KEY environment variable.');
    }

    try {
      const openaiMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: openaiMessages,
        max_tokens: 1000,
        temperature: 0.7,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      return {
        message: response,
        usage: completion.usage ? {
          prompt_tokens: completion.usage.prompt_tokens,
          completion_tokens: completion.usage.completion_tokens,
          total_tokens: completion.usage.total_tokens,
        } : undefined,
      };
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      throw new Error('Failed to get response from OpenAI');
    }
  }

  isConfigured(): boolean {
    return this.openai !== null;
  }
}

export const chatService = new ChatService();
