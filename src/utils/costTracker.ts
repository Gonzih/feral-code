import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { diagnostics } from './diagnostics.js';

export interface CostEntry {
  timestamp: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  sessionId?: string;
}

export interface CostSummary {
  totalCost: number;
  totalTokens: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  requestCount: number;
  costByProvider: Record<string, number>;
  costByModel: Record<string, number>;
  costByDay: Record<string, number>;
}

export interface ProviderCostConfig {
  inputCostPer1kTokens: number;
  outputCostPer1kTokens: number;
}

export class CostTracker {
  private costPath: string;
  private costData: CostEntry[] = [];
  private isLoaded = false;

  // Cost data (USD per 1k tokens) - updated as of 2024
  private static COST_CONFIG: Record<string, Record<string, ProviderCostConfig>> = {
    anthropic: {
      'claude-3-5-sonnet-20241022': { inputCostPer1kTokens: 0.003, outputCostPer1kTokens: 0.015 },
      'claude-3-5-haiku-20241022': { inputCostPer1kTokens: 0.001, outputCostPer1kTokens: 0.005 },
      'claude-3-opus-20240229': { inputCostPer1kTokens: 0.015, outputCostPer1kTokens: 0.075 },
      'claude-3-sonnet-20240229': { inputCostPer1kTokens: 0.003, outputCostPer1kTokens: 0.015 },
      'claude-3-haiku-20240307': { inputCostPer1kTokens: 0.00025, outputCostPer1kTokens: 0.00125 },
    },
    openai: {
      'gpt-4o': { inputCostPer1kTokens: 0.005, outputCostPer1kTokens: 0.015 },
      'gpt-4o-mini': { inputCostPer1kTokens: 0.00015, outputCostPer1kTokens: 0.0006 },
      'gpt-4': { inputCostPer1kTokens: 0.03, outputCostPer1kTokens: 0.06 },
      'gpt-4-turbo': { inputCostPer1kTokens: 0.01, outputCostPer1kTokens: 0.03 },
      'gpt-3.5-turbo': { inputCostPer1kTokens: 0.0005, outputCostPer1kTokens: 0.0015 },
    },
    openrouter: {
      'anthropic/claude-3.5-sonnet': { inputCostPer1kTokens: 0.003, outputCostPer1kTokens: 0.015 },
      'anthropic/claude-3-haiku': { inputCostPer1kTokens: 0.00025, outputCostPer1kTokens: 0.00125 },
      'openai/gpt-4o': { inputCostPer1kTokens: 0.005, outputCostPer1kTokens: 0.015 },
      'openai/gpt-4o-mini': { inputCostPer1kTokens: 0.00015, outputCostPer1kTokens: 0.0006 },
      'meta-llama/llama-3.1-8b-instruct:free': { inputCostPer1kTokens: 0, outputCostPer1kTokens: 0 },
      'meta-llama/llama-3.1-70b-instruct': { inputCostPer1kTokens: 0.0009, outputCostPer1kTokens: 0.0009 },
      'google/gemini-pro-1.5': { inputCostPer1kTokens: 0.00125, outputCostPer1kTokens: 0.005 },
    },
    ollama: {
      // Local models have no API costs
      'default': { inputCostPer1kTokens: 0, outputCostPer1kTokens: 0 },
    },
  };

  constructor() {
    this.costPath = join(homedir(), '.amai-code', 'costs.json');
  }

  private async ensureLoaded(): Promise<void> {
    if (this.isLoaded) return;

    try {
      const content = await readFile(this.costPath, 'utf-8');
      this.costData = JSON.parse(content);
    } catch (error) {
      // File doesn't exist or is invalid, start with empty data
      this.costData = [];
    }

    this.isLoaded = true;
  }

  async trackUsage(
    provider: string,
    model: string,
    inputTokens: number,
    outputTokens: number,
    sessionId?: string
  ): Promise<number> {
    await this.ensureLoaded();

    const cost = this.calculateCost(provider, model, inputTokens, outputTokens);
    
    const entry: CostEntry = {
      timestamp: new Date().toISOString(),
      provider,
      model,
      inputTokens,
      outputTokens,
      cost,
      sessionId,
    };

    this.costData.push(entry);
    await this.saveCostData();

    await diagnostics.info('cost', `Tracked usage cost: $${cost.toFixed(6)}`, {
      provider,
      model,
      inputTokens,
      outputTokens,
      cost,
    });

    return cost;
  }

  private calculateCost(provider: string, model: string, inputTokens: number, outputTokens: number): number {
    const providerConfig = CostTracker.COST_CONFIG[provider.toLowerCase()];
    if (!providerConfig) {
      // Unknown provider, assume no cost (like local models)
      return 0;
    }

    // Try exact model match first
    let modelConfig = providerConfig[model];
    
    // If no exact match, try partial matches or defaults
    if (!modelConfig) {
      const modelKey = Object.keys(providerConfig).find(key => 
        model.toLowerCase().includes(key.toLowerCase()) ||
        key.toLowerCase().includes(model.toLowerCase())
      );
      
      if (modelKey) {
        modelConfig = providerConfig[modelKey];
      } else {
        // Use default or first available model config
        modelConfig = providerConfig['default'] || Object.values(providerConfig)[0];
      }
    }

    if (!modelConfig) {
      return 0;
    }

    const inputCost = (inputTokens / 1000) * modelConfig.inputCostPer1kTokens;
    const outputCost = (outputTokens / 1000) * modelConfig.outputCostPer1kTokens;

    return inputCost + outputCost;
  }

  async getSummary(options?: {
    provider?: string;
    since?: string;
    until?: string;
    sessionId?: string;
  }): Promise<CostSummary> {
    await this.ensureLoaded();

    let filteredData = this.costData;

    // Apply filters
    if (options?.provider) {
      filteredData = filteredData.filter(entry => entry.provider === options.provider);
    }

    if (options?.since) {
      const sinceDate = new Date(options.since);
      filteredData = filteredData.filter(entry => new Date(entry.timestamp) >= sinceDate);
    }

    if (options?.until) {
      const untilDate = new Date(options.until);
      filteredData = filteredData.filter(entry => new Date(entry.timestamp) <= untilDate);
    }

    if (options?.sessionId) {
      filteredData = filteredData.filter(entry => entry.sessionId === options.sessionId);
    }

    // Calculate summary
    const summary: CostSummary = {
      totalCost: 0,
      totalTokens: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      requestCount: filteredData.length,
      costByProvider: {},
      costByModel: {},
      costByDay: {},
    };

    for (const entry of filteredData) {
      summary.totalCost += entry.cost;
      summary.totalInputTokens += entry.inputTokens;
      summary.totalOutputTokens += entry.outputTokens;
      summary.totalTokens += entry.inputTokens + entry.outputTokens;

      // Group by provider
      if (!summary.costByProvider[entry.provider]) {
        summary.costByProvider[entry.provider] = 0;
      }
      summary.costByProvider[entry.provider] += entry.cost;

      // Group by model
      const modelKey = `${entry.provider}/${entry.model}`;
      if (!summary.costByModel[modelKey]) {
        summary.costByModel[modelKey] = 0;
      }
      summary.costByModel[modelKey] += entry.cost;

      // Group by day
      const day = entry.timestamp.split('T')[0];
      if (!summary.costByDay[day]) {
        summary.costByDay[day] = 0;
      }
      summary.costByDay[day] += entry.cost;
    }

    return summary;
  }

  async getCurrentSessionCost(sessionId: string): Promise<number> {
    const summary = await this.getSummary({ sessionId });
    return summary.totalCost;
  }

  async getTodayCost(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const summary = await this.getSummary({ since: today + 'T00:00:00.000Z' });
    return summary.totalCost;
  }

  async getMonthCost(): Promise<number> {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const summary = await this.getSummary({ since: firstOfMonth });
    return summary.totalCost;
  }

  async resetCosts(): Promise<void> {
    this.costData = [];
    await this.saveCostData();
    await diagnostics.info('cost', 'Cost data has been reset');
  }

  async exportCosts(format: 'json' | 'csv' = 'json'): Promise<string> {
    await this.ensureLoaded();

    if (format === 'csv') {
      const headers = ['Timestamp', 'Provider', 'Model', 'Input Tokens', 'Output Tokens', 'Cost', 'Session ID'];
      const rows = this.costData.map(entry => [
        entry.timestamp,
        entry.provider,
        entry.model,
        entry.inputTokens.toString(),
        entry.outputTokens.toString(),
        entry.cost.toString(),
        entry.sessionId || '',
      ]);

      return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }

    return JSON.stringify(this.costData, null, 2);
  }

  getCostEstimate(provider: string, model: string, estimatedTokens: number): number {
    // Estimate based on typical input/output ratio (70% input, 30% output)
    const estimatedInputTokens = Math.round(estimatedTokens * 0.7);
    const estimatedOutputTokens = Math.round(estimatedTokens * 0.3);
    
    return this.calculateCost(provider, model, estimatedInputTokens, estimatedOutputTokens);
  }

  getProviderCostInfo(provider: string): Record<string, ProviderCostConfig> | undefined {
    return CostTracker.COST_CONFIG[provider.toLowerCase()];
  }

  private async saveCostData(): Promise<void> {
    try {
      await mkdir(dirname(this.costPath), { recursive: true });
      await writeFile(this.costPath, JSON.stringify(this.costData, null, 2), 'utf-8');
    } catch (error) {
      await diagnostics.error('cost', 'Failed to save cost data', error as Error);
    }
  }
}

// Global cost tracker instance
export const costTracker = new CostTracker();