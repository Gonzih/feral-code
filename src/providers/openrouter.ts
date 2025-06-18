import fetch from 'node-fetch';
import { AIProvider, ChatRequest, ChatResponse, Message } from '../types/index.js';
import { diagnostics } from '../utils/diagnostics.js';
import { ErrorHandler } from '../utils/errorHandler.js';

export class OpenRouterProvider implements AIProvider {
  name = 'openrouter';
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const startTime = Date.now();
    
    try {
      await diagnostics.info('provider', `Starting OpenRouter chat request`, {
        model: request.model || this.getDefaultModel(),
        messageCount: request.messages.length,
        hasTools: !!request.tools?.length,
      });

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': 'https://github.com/feral-code/feral-code',
        'X-Title': 'FERAL CODE',
      },
      body: JSON.stringify({
        model: request.model || this.getDefaultModel(),
        messages: request.messages,
        temperature: request.temperature || 0.7,
        max_tokens: request.maxTokens || 4000,
        tools: request.tools?.map(tool => ({
          type: 'function',
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
          },
        })),
      }),
    });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} ${error}`);
      }

      const data = await response.json() as any;
      
      const duration = Date.now() - startTime;
      await diagnostics.info('provider', `OpenRouter chat request completed`, {
        duration: `${duration}ms`,
        tokensUsed: data.usage?.total_tokens || 0,
        model: request.model || this.getDefaultModel(),
      });
      
      return {
        message: {
          role: 'assistant',
          content: data.choices[0]?.message?.content || '',
        },
        usage: {
          inputTokens: data.usage?.prompt_tokens || 0,
          outputTokens: data.usage?.completion_tokens || 0,
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      await diagnostics.error('provider', `OpenRouter chat request failed`, error as Error, {
        duration: `${duration}ms`,
        model: request.model || this.getDefaultModel(),
      });
      throw error;
    }
  }

  async *streamChat(request: ChatRequest): AsyncIterable<Partial<ChatResponse>> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': 'https://github.com/feral-code/feral-code',
        'X-Title': 'FERAL CODE',
      },
      body: JSON.stringify({
        model: request.model || this.getDefaultModel(),
        messages: request.messages,
        temperature: request.temperature || 0.7,
        max_tokens: request.maxTokens || 4000,
        tools: request.tools?.map(tool => ({
          type: 'function',
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
          },
        })),
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} ${error}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = (response.body as any).getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                yield {
                  message: {
                    role: 'assistant',
                    content,
                  },
                };
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  validateConfig(): boolean {
    return !!this.apiKey;
  }

  getDefaultModel(): string {
    return 'openai/gpt-4-turbo-preview';
  }

  getSupportedModels(): string[] {
    return [
      'openai/gpt-4-turbo-preview',
      'openai/gpt-4',
      'openai/gpt-3.5-turbo',
      'meta-llama/llama-3.1-405b-instruct',
      'meta-llama/llama-3.1-70b-instruct',
      'google/gemini-pro-1.5',
      'google/gemini-flash-1.5',
      'mistralai/mistral-large',
      'microsoft/wizardlm-2-8x22b',
      'cohere/command-r-plus'
    ];
  }
}