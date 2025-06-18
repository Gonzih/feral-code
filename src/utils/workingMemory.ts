import { Message } from '../types/index.js';
import { diagnostics } from './diagnostics.js';

export interface MemoryEntry {
  id: string;
  timestamp: Date;
  type: 'insight' | 'pattern' | 'preference' | 'context' | 'goal' | 'reflection';
  content: string;
  importance: number; // 1-10 scale
  tags: string[];
  connections: string[]; // IDs of related entries
}

export interface ConversationState {
  userPersonality: {
    communicationStyle: 'direct' | 'detailed' | 'conversational' | 'technical';
    expertise: string[];
    preferences: string[];
    goals: string[];
  };
  conversationFlow: {
    currentGoal: string;
    subgoals: string[];
    completedTasks: string[];
    blockers: string[];
  };
  patterns: {
    successfulApproaches: string[];
    failedApproaches: string[];
    userReactions: { positive: string[]; negative: string[] };
  };
}

export class WorkingMemory {
  private memories: Map<string, MemoryEntry> = new Map();
  private conversationState: ConversationState;
  private maxMemories = 1000;
  private sessionId: string;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
    this.conversationState = this.initializeState();
  }

  private initializeState(): ConversationState {
    return {
      userPersonality: {
        communicationStyle: 'conversational',
        expertise: [],
        preferences: [],
        goals: []
      },
      conversationFlow: {
        currentGoal: '',
        subgoals: [],
        completedTasks: [],
        blockers: []
      },
      patterns: {
        successfulApproaches: [],
        failedApproaches: [],
        userReactions: { positive: [], negative: [] }
      }
    };
  }

  async addMemory(entry: Omit<MemoryEntry, 'id' | 'timestamp'>): Promise<string> {
    const id = `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const memory: MemoryEntry = {
      ...entry,
      id,
      timestamp: new Date()
    };

    this.memories.set(id, memory);

    // Maintain memory limit
    if (this.memories.size > this.maxMemories) {
      this.pruneMemories();
    }

    await diagnostics.debug('system', `Added memory: ${entry.type} - ${entry.content.substring(0, 100)}...`);
    return id;
  }

  async reflect(trigger: string): Promise<string> {
    const relevantMemories = this.searchMemories(trigger, 5);
    const patterns = this.identifyPatterns(relevantMemories);
    
    let reflection = `🔍 **Memory Reflection on: "${trigger}"**\n\n`;
    
    reflection += `**Relevant Past Experiences**:\n`;
    relevantMemories.forEach((memory, index) => {
      reflection += `${index + 1}. ${memory.content} (${memory.type}, importance: ${memory.importance})\n`;
    });
    
    reflection += `\n**Patterns Identified**:\n`;
    patterns.forEach((pattern, index) => {
      reflection += `${index + 1}. ${pattern}\n`;
    });

    reflection += `\n**Current Context**:\n`;
    reflection += `- Communication Style: ${this.conversationState.userPersonality.communicationStyle}\n`;
    reflection += `- Current Goal: ${this.conversationState.conversationFlow.currentGoal || 'Not set'}\n`;
    reflection += `- Recent Successes: ${this.conversationState.patterns.successfulApproaches.slice(-3).join(', ')}\n`;

    return reflection;
  }

  searchMemories(query: string, limit: number = 10): MemoryEntry[] {
    const queryWords = query.toLowerCase().split(' ');
    
    return Array.from(this.memories.values())
      .map(memory => ({
        memory,
        score: this.calculateRelevance(memory, queryWords)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.memory);
  }

  private calculateRelevance(memory: MemoryEntry, queryWords: string[]): number {
    const content = memory.content.toLowerCase();
    const tags = memory.tags.join(' ').toLowerCase();
    
    let score = 0;
    queryWords.forEach(word => {
      if (content.includes(word)) score += 2;
      if (tags.includes(word)) score += 3;
    });
    
    // Boost recent and important memories
    const daysSinceCreation = (Date.now() - memory.timestamp.getTime()) / (1000 * 60 * 60 * 24);
    score += memory.importance;
    score += Math.max(0, 5 - daysSinceCreation); // Recent bonus
    
    return score;
  }

  private identifyPatterns(memories: MemoryEntry[]): string[] {
    const patterns: string[] = [];
    
    // Pattern detection logic
    const typeGroups = memories.reduce((groups, memory) => {
      groups[memory.type] = (groups[memory.type] || 0) + 1;
      return groups;
    }, {} as Record<string, number>);

    Object.entries(typeGroups).forEach(([type, count]) => {
      if (count >= 2) {
        patterns.push(`Recurring ${type} experiences (${count} instances)`);
      }
    });

    // Tag pattern analysis
    const allTags = memories.flatMap(m => m.tags);
    const tagCounts = allTags.reduce((counts, tag) => {
      counts[tag] = (counts[tag] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    Object.entries(tagCounts).forEach(([tag, count]) => {
      if (count >= 2) {
        patterns.push(`Common theme: ${tag} (appears ${count} times)`);
      }
    });

    return patterns;
  }

  updateUserPersonality(updates: Partial<ConversationState['userPersonality']>): void {
    this.conversationState.userPersonality = {
      ...this.conversationState.userPersonality,
      ...updates
    };
  }

  updateConversationFlow(updates: Partial<ConversationState['conversationFlow']>): void {
    this.conversationState.conversationFlow = {
      ...this.conversationState.conversationFlow,
      ...updates
    };
  }

  recordSuccess(approach: string): void {
    this.conversationState.patterns.successfulApproaches.push(approach);
    if (this.conversationState.patterns.successfulApproaches.length > 20) {
      this.conversationState.patterns.successfulApproaches.shift();
    }
  }

  recordFailure(approach: string): void {
    this.conversationState.patterns.failedApproaches.push(approach);
    if (this.conversationState.patterns.failedApproaches.length > 20) {
      this.conversationState.patterns.failedApproaches.shift();
    }
  }

  getCurrentState(): ConversationState {
    return { ...this.conversationState };
  }

  private pruneMemories(): void {
    // Keep most important and recent memories
    const memoryArray = Array.from(this.memories.values())
      .sort((a, b) => {
        const scoreA = a.importance + (Date.now() - a.timestamp.getTime()) / (1000 * 60 * 60 * 24);
        const scoreB = b.importance + (Date.now() - b.timestamp.getTime()) / (1000 * 60 * 60 * 24);
        return scoreB - scoreA;
      })
      .slice(0, this.maxMemories * 0.8); // Keep 80%

    this.memories.clear();
    memoryArray.forEach(memory => this.memories.set(memory.id, memory));
  }

  async analyzeMessages(messages: Message[]): Promise<void> {
    // Analyze recent messages for patterns and insights
    const recentMessages = messages.slice(-10);
    
    for (const message of recentMessages) {
      if (message.role === 'user') {
        await this.analyzeUserMessage(message.content);
      }
    }
  }

  private async analyzeUserMessage(content: string): Promise<void> {
    const words = content.toLowerCase().split(/\s+/);
    
    // Detect communication style
    const technicalWords = ['function', 'class', 'api', 'database', 'algorithm', 'implementation'];
    const casualWords = ['please', 'thanks', 'maybe', 'i think', 'could you'];
    const directWords = ['do', 'make', 'create', 'fix', 'implement'];

    const technicalScore = technicalWords.filter(word => words.includes(word)).length;
    const casualScore = casualWords.filter(phrase => content.toLowerCase().includes(phrase)).length;
    const directScore = directWords.filter(word => words.includes(word)).length;

    if (technicalScore > 2) {
      this.updateUserPersonality({ communicationStyle: 'technical' });
    } else if (directScore > casualScore) {
      this.updateUserPersonality({ communicationStyle: 'direct' });
    } else if (casualScore > 0) {
      this.updateUserPersonality({ communicationStyle: 'conversational' });
    }

    // Extract potential goals and context
    const goalIndicators = ['want to', 'need to', 'trying to', 'goal is', 'working on'];
    for (const indicator of goalIndicators) {
      if (content.toLowerCase().includes(indicator)) {
        const goalMatch = content.match(new RegExp(`${indicator} (.{0,50})`, 'i'));
        if (goalMatch) {
          this.updateConversationFlow({ currentGoal: goalMatch[1].trim() });
          break;
        }
      }
    }
  }
}

export const createWorkingMemory = (sessionId: string): WorkingMemory => {
  return new WorkingMemory(sessionId);
};