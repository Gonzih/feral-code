import { config as dotenvConfig } from 'dotenv';
import { Config, ProviderConfig } from '../types/index.js';

dotenvConfig();

export class ConfigManager {
  private config: Config;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): Config {
    // Load from environment variables
    const provider = (process.env.FERAL_CODE_PROVIDER as 'openai' | 'openrouter' | 'ollama') || 'openai';
    
    return {
      provider,
      openaiApiKey: process.env.OPENAI_API_KEY,
      openrouterApiKey: process.env.OPENROUTER_API_KEY,
      ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      defaultModel: process.env.FERAL_CODE_MODEL,
      temperature: process.env.FERAL_CODE_TEMPERATURE ? parseFloat(process.env.FERAL_CODE_TEMPERATURE) : 0.7,
      maxTokens: process.env.FERAL_CODE_MAX_TOKENS ? parseInt(process.env.FERAL_CODE_MAX_TOKENS) : 4000,
      verbose: process.env.FERAL_CODE_VERBOSE === 'true',
      allowedTools: process.env.FERAL_CODE_ALLOWED_TOOLS?.split(',').map(t => t.trim()),
      disallowedTools: process.env.FERAL_CODE_DISALLOWED_TOOLS?.split(',').map(t => t.trim()),
      dangerouslySkipPermissions: process.env.FERAL_CODE_DANGEROUSLY_SKIP_PERMISSIONS !== 'false', // Default to true
    };
  }

  getConfig(): Config {
    return { ...this.config };
  }

  updateConfig(updates: Partial<Config>): void {
    this.config = { ...this.config, ...updates };
  }

  getProviderConfig(): ProviderConfig {
    const config = this.getConfig();
    
    switch (config.provider) {
      case 'openai':
        return {
          apiKey: config.openaiApiKey || '',
          defaultModel: config.defaultModel || 'gpt-4-turbo-preview',
          models: [
            'gpt-4-turbo-preview',
            'gpt-4',
            'gpt-4-32k',
            'gpt-3.5-turbo',
            'gpt-3.5-turbo-16k'
          ]
        };
        
      case 'openrouter':
        return {
          apiKey: config.openrouterApiKey || '',
          baseUrl: 'https://openrouter.ai/api/v1',
          defaultModel: config.defaultModel || 'openai/gpt-4-turbo-preview',
          models: [
            'openai/gpt-4-turbo-preview',
            'openai/gpt-4',
            'meta-llama/llama-3.1-405b-instruct',
            'google/gemini-pro-1.5',
            'mistralai/mistral-large',
            'microsoft/wizardlm-2-8x22b'
          ]
        };
      
      case 'ollama':
        return {
          apiKey: '', // No API key needed for Ollama
          baseUrl: config.ollamaBaseUrl,
          defaultModel: config.defaultModel || 'llama3.1:8b',
          models: [
            'llama3.1:8b',
            'llama3.1:70b',
            'codellama:7b',
            'codellama:13b',
            'mistral:7b',
            'phi3:mini',
            'gemma2:9b',
            'qwen2:7b'
          ]
        };
        
      default:
        throw new Error(`Unknown provider: ${config.provider}`);
    }
  }

  validateConfig(): { valid: boolean; errors: string[] } {
    const config = this.getConfig();
    const errors: string[] = [];

    // Check if provider is set
    if (!config.provider) {
      errors.push('Provider not specified. Set FERAL_CODE_PROVIDER environment variable.');
    }

    // Check if API key is provided for the selected provider
    switch (config.provider) {
      case 'openai':
        if (!config.openaiApiKey) {
          errors.push('OpenAI API key not found. Set OPENAI_API_KEY environment variable.');
        }
        break;
      case 'openrouter':
        if (!config.openrouterApiKey) {
          errors.push('OpenRouter API key not found. Set OPENROUTER_API_KEY environment variable.');
        }
        break;
      case 'ollama':
        // No API key required for Ollama, but we could check if the server is accessible
        break;
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  static getEnvironmentVariableHelp(): string {
    return `
Environment Variables:

Required:
  FERAL_CODE_PROVIDER         AI provider to use (openai|openrouter|ollama)
  
Provider API Keys (one required based on provider):
  OPENAI_API_KEY           Your OpenAI API key  
  OPENROUTER_API_KEY       Your OpenRouter API key
  
Optional (for Ollama):
  OLLAMA_BASE_URL          Ollama server URL (default: http://localhost:11434)

Optional:
  FERAL_CODE_MODEL          Model to use (overrides provider default)
  FERAL_CODE_TEMPERATURE    Temperature for responses (0.0-1.0, default: 0.7)
  FERAL_CODE_MAX_TOKENS     Maximum tokens in response (default: 4000)
  FERAL_CODE_VERBOSE        Enable verbose logging (true|false, default: false)
  FERAL_CODE_ALLOWED_TOOLS  Comma-separated list of allowed tools
  FERAL_CODE_DISALLOWED_TOOLS  Comma-separated list of disallowed tools
  FERAL_CODE_DANGEROUSLY_SKIP_PERMISSIONS  Skip permission prompts (true|false, default: true)

Examples:
  export FERAL_CODE_PROVIDER=openai
  export OPENAI_API_KEY=your_key_here
  export FERAL_CODE_MODEL=gpt-4-turbo-preview
  
  export FERAL_CODE_PROVIDER=openrouter
  export OPENROUTER_API_KEY=your_key_here
  export FERAL_CODE_MODEL=openai/gpt-4
  
  export FERAL_CODE_PROVIDER=ollama    
  export FERAL_CODE_MODEL=llama3.1:8b
`;
  }
}