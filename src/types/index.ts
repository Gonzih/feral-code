export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export interface ChatRequest {
  messages: Message[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: Tool[];
}

export interface ChatResponse {
  message: Message;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface AIProvider {
  name: string;
  chat(request: ChatRequest): Promise<ChatResponse>;
  streamChat(request: ChatRequest): AsyncIterable<Partial<ChatResponse>>;
  validateConfig(): boolean | Promise<boolean>;
  getDefaultModel(): string;
  getSupportedModels(): string[] | Promise<string[]>;
}

export interface Config {
  provider: 'openai' | 'openrouter' | 'ollama';
  openaiApiKey?: string;
  openrouterApiKey?: string;
  ollamaBaseUrl?: string;
  defaultModel?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  verbose?: boolean;
  allowedTools?: string[];
  disallowedTools?: string[];
  dangerouslySkipPermissions?: boolean;
}

export interface ProviderConfig {
  apiKey: string;
  baseUrl?: string;
  defaultModel: string;
  models: string[];
}