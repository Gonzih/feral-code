import { BaseTool } from './base.js';
import { createWorkingMemory, WorkingMemory } from '../utils/workingMemory.js';

export class MemoryTool extends BaseTool {
  name = 'Memory';
  description = 'Store, retrieve, and reflect on memories and patterns across conversations';
  parameters = {
    action: {
      type: 'string',
      description: 'Action to perform: store, retrieve, reflect, analyze',
      required: true,
      enum: ['store', 'retrieve', 'reflect', 'analyze']
    },
    content: {
      type: 'string',
      description: 'Content to store or query to search for',
    },
    type: {
      type: 'string',
      description: 'Type of memory: insight, pattern, preference, context, goal, reflection',
      enum: ['insight', 'pattern', 'preference', 'context', 'goal', 'reflection']
    },
    importance: {
      type: 'number',
      description: 'Importance level (1-10)',
    },
    tags: {
      type: 'string',
      description: 'Comma-separated tags for categorization',
    }
  };

  private memory: WorkingMemory | null = null;

  async _execute(params: Record<string, any>): Promise<string> {
    const { action, content, type = 'insight', importance = 5, tags = '' } = params;
    
    // Initialize memory if not exists (in real implementation, this would be session-based)
    if (!this.memory) {
      this.memory = createWorkingMemory('current-session');
    }

    switch (action) {
      case 'store':
        if (!content) {
          return 'Error: Content is required for storing memories';
        }
        
        const memoryId = await this.memory.addMemory({
          type,
          content,
          importance,
          tags: tags.split(',').map((tag: string) => tag.trim()).filter(Boolean),
          connections: []
        });
        
        return `📝 **Memory Stored**\n\nID: ${memoryId}\nType: ${type}\nContent: ${content}\nImportance: ${importance}\nTags: ${tags}\n\n*This memory will help me maintain context and learn from our interactions.*`;

      case 'retrieve':
        if (!content) {
          return 'Error: Query content is required for retrieving memories';
        }
        
        const memories = this.memory.searchMemories(content, 5);
        if (memories.length === 0) {
          return `🔍 **Memory Search Results**\n\nNo memories found matching: "${content}"`;
        }
        
        let result = `🔍 **Memory Search Results** (${memories.length} found)\n\n`;
        memories.forEach((memory, index) => {
          result += `**${index + 1}.** [${memory.type}] ${memory.content}\n`;
          result += `   *Importance: ${memory.importance}, Tags: ${memory.tags.join(', ')}, Date: ${memory.timestamp.toLocaleDateString()}*\n\n`;
        });
        
        return result;

      case 'reflect':
        if (!content) {
          return 'Error: Reflection trigger is required';
        }
        
        return await this.memory.reflect(content);

      case 'analyze':
        const state = this.memory.getCurrentState();
        let analysis = `🧠 **Self-Analysis Report**\n\n`;
        
        analysis += `**User Personality Profile**:\n`;
        analysis += `- Communication Style: ${state.userPersonality.communicationStyle}\n`;
        analysis += `- Expertise Areas: ${state.userPersonality.expertise.join(', ') || 'Not yet identified'}\n`;
        analysis += `- Preferences: ${state.userPersonality.preferences.join(', ') || 'Learning...'}\n`;
        analysis += `- Goals: ${state.userPersonality.goals.join(', ') || 'To be discovered'}\n\n`;
        
        analysis += `**Conversation Flow**:\n`;
        analysis += `- Current Goal: ${state.conversationFlow.currentGoal || 'Not set'}\n`;
        analysis += `- Subgoals: ${state.conversationFlow.subgoals.join(', ') || 'None identified'}\n`;
        analysis += `- Completed Tasks: ${state.conversationFlow.completedTasks.slice(-3).join(', ') || 'None yet'}\n`;
        analysis += `- Current Blockers: ${state.conversationFlow.blockers.join(', ') || 'None identified'}\n\n`;
        
        analysis += `**Learning Patterns**:\n`;
        analysis += `- Successful Approaches: ${state.patterns.successfulApproaches.slice(-3).join(', ') || 'Still learning'}\n`;
        analysis += `- Failed Approaches: ${state.patterns.failedApproaches.slice(-3).join(', ') || 'No failures yet'}\n`;
        analysis += `- Positive User Reactions: ${state.patterns.userReactions.positive.slice(-3).join(', ') || 'Observing...'}\n`;
        
        analysis += `\n*This self-analysis helps me understand our interaction patterns and adapt my approach accordingly.*`;
        
        return analysis;

      default:
        return `Error: Unknown action "${action}". Available actions: store, retrieve, reflect, analyze`;
    }
  }
}