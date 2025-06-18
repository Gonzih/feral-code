import fetch from 'node-fetch';
import { AIProvider, ChatRequest, ChatResponse, Message } from '../types/index.js';
import { diagnostics } from '../utils/diagnostics.js';
import { ErrorHandler } from '../utils/errorHandler.js';

export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

export class OllamaProvider implements AIProvider {
  name = 'ollama';
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:11434') {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const startTime = Date.now();
    
    try {
      await diagnostics.info('provider', `Starting Ollama chat request`, {
        model: request.model || this.getDefaultModel(),
        messageCount: request.messages.length,
        hasTools: !!request.tools?.length,
        baseUrl: this.baseUrl,
      });

      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: request.model || this.getDefaultModel(),
          messages: this.convertMessages(request.messages),
          stream: false,
          options: {
            temperature: request.temperature || 0.7,
            num_predict: request.maxTokens || 4000,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Ollama API error: ${response.status} ${error}`);
      }

      const data = await response.json() as any;
      
      const duration = Date.now() - startTime;
      await diagnostics.info('provider', `Ollama chat request completed`, {
        duration: `${duration}ms`,
        model: request.model || this.getDefaultModel(),
        baseUrl: this.baseUrl,
      });
      
      return {
        message: {
          role: 'assistant',
          content: data.message?.content || '',
        },
        usage: {
          inputTokens: data.prompt_eval_count || 0,
          outputTokens: data.eval_count || 0,
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      await diagnostics.error('provider', `Ollama chat request failed`, error as Error, {
        duration: `${duration}ms`,
        model: request.model || this.getDefaultModel(),
        baseUrl: this.baseUrl,
      });
      throw error;
    }
  }

  async *streamChat(request: ChatRequest): AsyncIterable<Partial<ChatResponse>> {
    try {
      await diagnostics.info('provider', `Starting Ollama streaming chat`, {
        model: request.model || this.getDefaultModel(),
        baseUrl: this.baseUrl,
      });

      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: request.model || this.getDefaultModel(),
          messages: this.convertMessages(request.messages),
          stream: true,
          options: {
            temperature: request.temperature || 0.7,
            num_predict: request.maxTokens || 4000,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Ollama API error: ${response.status} ${error}`);
      }

      if (!response.body) {
        throw new Error('No response body received from Ollama');
      }

      const reader = (response.body as any)?.getReader();
      if (!reader) {
        throw new Error('Response body not readable');
      }
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              
              if (data.message?.content) {
                yield {
                  message: {
                    role: 'assistant',
                    content: data.message.content,
                  },
                };
              }
              
              if (data.done) {
                yield {
                  usage: {
                    inputTokens: data.prompt_eval_count || 0,
                    outputTokens: data.eval_count || 0,
                  },
                };
              }
            } catch (parseError) {
              // Skip invalid JSON lines
              continue;
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      await diagnostics.error('provider', `Ollama streaming chat failed`, error as Error, {
        baseUrl: this.baseUrl,
      });
      throw error;
    }
  }

  async validateConfig(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        timeout: 5000,
      } as any);
      
      return response.ok;
    } catch (error) {
      await diagnostics.warn('provider', `Ollama validation failed`, {
        baseUrl: this.baseUrl,
        error: (error as Error).message,
      });
      return false;
    }
  }

  getDefaultModel(): string {
    return 'llama3.2';
  }

  async getSupportedModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      
      if (!response.ok) {
        return [this.getDefaultModel()];
      }
      
      const data = await response.json() as { models: OllamaModel[] };
      return data.models?.map(model => model.name) || [this.getDefaultModel()];
    } catch (error) {
      await diagnostics.warn('provider', `Failed to fetch Ollama models`, {
        baseUrl: this.baseUrl,
        error: (error as Error).message,
      });
      return [this.getDefaultModel()];
    }
  }

  async getModelInfo(): Promise<{ model: string; provider: string; location: string }> {
    const isLocal = this.baseUrl.includes('localhost') || this.baseUrl.includes('127.0.0.1');
    
    return {
      model: this.getDefaultModel(),
      provider: 'Ollama',
      location: isLocal ? 'Local' : 'Remote',
    };
  }

  async pullModel(modelName: string): Promise<boolean> {
    try {
      await diagnostics.info('provider', `Pulling Ollama model: ${modelName}`, {
        modelName,
        baseUrl: this.baseUrl,
      });

      const response = await fetch(`${this.baseUrl}/api/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: modelName,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to pull model: ${response.statusText}`);
      }

      // Ollama returns streaming response for pull progress
      if (response.body) {
        const reader = (response.body as any)?.getReader();
        if (!reader) {
          throw new Error('Response body not readable');
        }
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim());
            
            for (const line of lines) {
              try {
                const data = JSON.parse(line);
                if (data.status === 'success') {
                  await diagnostics.info('provider', `Successfully pulled model: ${modelName}`);
                  return true;
                }
              } catch (parseError) {
                // Continue processing other lines
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      }

      return true;
    } catch (error) {
      await diagnostics.error('provider', `Failed to pull Ollama model: ${modelName}`, error as Error);
      return false;
    }
  }

  async deleteModel(modelName: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: modelName,
        }),
      });

      const success = response.ok;
      
      if (success) {
        await diagnostics.info('provider', `Successfully deleted model: ${modelName}`);
      } else {
        await diagnostics.error('provider', `Failed to delete model: ${modelName}`, 
          new Error(`HTTP ${response.status}: ${response.statusText}`));
      }

      return success;
    } catch (error) {
      await diagnostics.error('provider', `Failed to delete Ollama model: ${modelName}`, error as Error);
      return false;
    }
  }

  async getStatus(): Promise<{
    available: boolean;
    version?: string;
    models: string[];
    location: string;
  }> {
    try {
      const [versionResponse, modelsResponse] = await Promise.all([
        fetch(`${this.baseUrl}/api/version`).catch(() => null),
        this.getSupportedModels(),
      ]);

      let version: string | undefined;
      if (versionResponse?.ok) {
        const versionData = await versionResponse.json() as any;
        version = versionData.version;
      }

      const isLocal = this.baseUrl.includes('localhost') || this.baseUrl.includes('127.0.0.1');

      return {
        available: await this.validateConfig(),
        version,
        models: modelsResponse,
        location: isLocal ? 'Local' : 'Remote',
      };
    } catch (error) {
      return {
        available: false,
        models: [],
        location: 'Unknown',
      };
    }
  }

  private convertMessages(messages: Message[]): any[] {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));
  }
}