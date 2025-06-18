import fetch from 'node-fetch';
import { AIProvider, ChatRequest, ChatResponse, Message } from '../types/index.js';

export class OpenAIProvider implements AIProvider {
  name = 'openai';
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
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
      throw new Error(`OpenAI API error: ${response.status} ${error}`);
    }

    const data = await response.json() as any;
    
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
  }

  async *streamChat(request: ChatRequest): AsyncIterable<Partial<ChatResponse>> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
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
      throw new Error(`OpenAI API error: ${response.status} ${error}`);
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
    return 'gpt-4-turbo-preview';
  }

  getSupportedModels(): string[] {
    return [
      'gpt-4-turbo-preview',
      'gpt-4',
      'gpt-4-32k',
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-16k'
    ];
  }
}