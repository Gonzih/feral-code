import { AIProvider } from '../types/index.js';
import { ConfigManager } from '../utils/config.js';
import { OpenAIProvider } from './openai.js';
import { OpenRouterProvider } from './openrouter.js';
import { OllamaProvider } from './ollama.js';

export { OpenAIProvider, OpenRouterProvider, OllamaProvider };

export class ProviderFactory {
  static createProvider(configManager: ConfigManager): AIProvider {
    const config = configManager.getConfig();
    const providerConfig = configManager.getProviderConfig();

    switch (config.provider) {
      case 'openai':
        return new OpenAIProvider(providerConfig.apiKey);
      case 'openrouter':
        return new OpenRouterProvider(providerConfig.apiKey);
      case 'ollama':
        return new OllamaProvider(providerConfig.baseUrl || 'http://localhost:11434');
      default:
        throw new Error(`Unknown provider: ${config.provider}`);
    }
  }
}