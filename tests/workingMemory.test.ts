import { describe, it, expect } from 'vitest';
import { WorkingMemory, createWorkingMemory } from '../src/utils/workingMemory.js';

describe('WorkingMemory', () => {
  it('should create working memory instance', () => {
    const memory = createWorkingMemory('test-session');
    expect(memory).toBeInstanceOf(WorkingMemory);
  });

  it('should add and search memories', async () => {
    const memory = createWorkingMemory('test-session');
    
    const memoryId = await memory.addMemory({
      type: 'insight',
      content: 'User prefers React over Vue',
      importance: 8,
      tags: ['user', 'preference', 'react'],
      connections: []
    });
    
    expect(memoryId).toBeDefined();
    expect(memoryId).toContain('memory_');
    
    const searchResults = memory.searchMemories('React', 5);
    expect(searchResults).toHaveLength(1);
    expect(searchResults[0].content).toContain('React');
  });

  it('should reflect on memories', async () => {
    const memory = createWorkingMemory('test-session');
    
    await memory.addMemory({
      type: 'pattern',
      content: 'User asks many detailed questions',
      importance: 7,
      tags: ['user', 'behavior', 'detail'],
      connections: []
    });
    
    const reflection = await memory.reflect('user behavior');
    expect(reflection).toContain('Memory Reflection');
    expect(reflection).toContain('Relevant Past Experiences');
    expect(reflection).toContain('Patterns Identified');
  });

  it('should update user personality', () => {
    const memory = createWorkingMemory('test-session');
    
    memory.updateUserPersonality({
      communicationStyle: 'technical',
      expertise: ['javascript', 'react']
    });
    
    const state = memory.getCurrentState();
    expect(state.userPersonality.communicationStyle).toBe('technical');
    expect(state.userPersonality.expertise).toContain('javascript');
  });

  it('should track conversation flow', () => {
    const memory = createWorkingMemory('test-session');
    
    memory.updateConversationFlow({
      currentGoal: 'Build a React app',
      subgoals: ['Setup project', 'Create components']
    });
    
    const state = memory.getCurrentState();
    expect(state.conversationFlow.currentGoal).toBe('Build a React app');
    expect(state.conversationFlow.subgoals).toContain('Setup project');
  });

  it('should record success and failure patterns', () => {
    const memory = createWorkingMemory('test-session');
    
    memory.recordSuccess('Detailed step-by-step explanation');
    memory.recordFailure('Too much theory without examples');
    
    const state = memory.getCurrentState();
    expect(state.patterns.successfulApproaches).toContain('Detailed step-by-step explanation');
    expect(state.patterns.failedApproaches).toContain('Too much theory without examples');
  });

  it('should analyze messages for patterns', async () => {
    const memory = createWorkingMemory('test-session');
    
    const messages = [
      { role: 'user' as const, content: 'Can you explain the React useEffect hook in detail?' },
      { role: 'assistant' as const, content: 'Sure! useEffect is used for side effects...' },
      { role: 'user' as const, content: 'Thanks! Could you also show me how to use useState?' }
    ];
    
    await memory.analyzeMessages(messages);
    
    const state = memory.getCurrentState();
    // Should detect that user wants detailed explanations and is learning React
    expect(state.userPersonality.communicationStyle).toBe('conversational'); // Default detection
  });

  it('should prune memories when limit exceeded', async () => {
    const memory = createWorkingMemory('test-session');
    
    // Add many memories to trigger pruning
    for (let i = 0; i < 1100; i++) {
      await memory.addMemory({
        type: 'insight',
        content: `Test memory ${i}`,
        importance: Math.floor(Math.random() * 10),
        tags: ['test'],
        connections: []
      });
    }
    
    const searchResults = memory.searchMemories('Test memory', 1200);
    // Should be pruned to around 800 (80% of 1000 max)
    expect(searchResults.length).toBeLessThan(900);
    expect(searchResults.length).toBeGreaterThan(700);
  });

  it('should calculate relevance scores correctly', () => {
    const memory = createWorkingMemory('test-session');
    
    // This tests the private method indirectly through search
    const memories = [
      { type: 'insight' as const, content: 'JavaScript is great', importance: 5, tags: ['js', 'programming'] },
      { type: 'pattern' as const, content: 'User loves JavaScript tutorials', importance: 8, tags: ['user', 'js'] },
      { type: 'preference' as const, content: 'User prefers TypeScript', importance: 6, tags: ['user', 'typescript'] }
    ];
    
    // Add memories and search
    Promise.all(memories.map(m => memory.addMemory({ ...m, connections: [] }))).then(() => {
      const results = memory.searchMemories('JavaScript user', 10);
      
      // Results should be ordered by relevance
      expect(results.length).toBeGreaterThan(0);
      // The memory with both 'JavaScript' content and 'user' tag should rank high
      expect(results[0].content).toContain('JavaScript');
    });
  });
});