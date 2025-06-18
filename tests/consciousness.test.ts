import { describe, it, expect } from 'vitest';
import { 
  ThinkTool, 
  MemoryTool, 
  ConfidenceTool, 
  PerspectiveTool, 
  AdaptTool, 
  MetacognitionTool,
  CreativeTool 
} from '../src/tools/index.js';

describe('Consciousness Tools', () => {
  describe('ThinkTool', () => {
    it('should create a thinking session', async () => {
      const thinkTool = new ThinkTool();
      const result = await thinkTool.execute({
        question: 'What is the best way to learn programming?',
        depth: 'medium'
      });
      
      expect(result).toContain('Deep Thinking Session');
      expect(result).toContain('Reflection Process');
      expect(result).toContain('Synthesis');
    });

    it('should handle different thinking depths', async () => {
      const thinkTool = new ThinkTool();
      const shallowResult = await thinkTool.execute({
        question: 'Test question',
        depth: 'shallow'
      });
      
      const deepResult = await thinkTool.execute({
        question: 'Test question',
        depth: 'deep'
      });
      
      expect(shallowResult).toBeDefined();
      expect(deepResult).toBeDefined();
      expect(deepResult.length).toBeGreaterThan(shallowResult.length);
    });
  });

  describe('MemoryTool', () => {
    it('should store memories', async () => {
      const memoryTool = new MemoryTool();
      const result = await memoryTool.execute({
        action: 'store',
        content: 'User prefers detailed explanations',
        type: 'preference',
        importance: 8,
        tags: 'user,preference,detail'
      });
      
      expect(result).toContain('Memory Stored');
      expect(result).toContain('User prefers detailed explanations');
    });

    it('should handle missing content for store action', async () => {
      const memoryTool = new MemoryTool();
      const result = await memoryTool.execute({
        action: 'store'
      });
      
      expect(result).toContain('Error: Content is required');
    });

    it('should analyze current state', async () => {
      const memoryTool = new MemoryTool();
      const result = await memoryTool.execute({
        action: 'analyze'
      });
      
      expect(result).toContain('Self-Analysis Report');
      expect(result).toContain('User Personality Profile');
      expect(result).toContain('Conversation Flow');
    });
  });

  describe('ConfidenceTool', () => {
    it('should assess confidence', async () => {
      const confidenceTool = new ConfidenceTool();
      const result = await confidenceTool.execute({
        action: 'assess',
        topic: 'JavaScript programming best practices'
      });
      
      expect(result).toContain('Confidence Assessment');
      expect(result).toContain('Confidence Factors Analysis');
      expect(result).toContain('Overall Confidence');
    });

    it('should express uncertainty', async () => {
      const confidenceTool = new ConfidenceTool();
      const result = await confidenceTool.execute({
        action: 'express',
        topic: 'Quantum computing',
        current_confidence: 30
      });
      
      expect(result).toContain('Uncertainty Expression');
      expect(result).toContain('(30%)');
    });

    it('should seek clarification', async () => {
      const confidenceTool = new ConfidenceTool();
      const result = await confidenceTool.execute({
        action: 'clarify',
        topic: 'Complex technical implementation'
      });
      
      expect(result).toContain('Seeking Clarification');
      expect(result).toContain('clarifying questions');
    });
  });

  describe('PerspectiveTool', () => {
    it('should analyze from multiple perspectives', async () => {
      const perspectiveTool = new PerspectiveTool();
      const result = await perspectiveTool.execute({
        question: 'Should we implement microservices?',
        perspectives: 'user,developer,business',
        synthesis: true
      });
      
      expect(result).toContain('Multi-Perspective Analysis');
      expect(result).toContain('USER PERSPECTIVE');
      expect(result).toContain('DEVELOPER PERSPECTIVE');
      expect(result).toContain('BUSINESS PERSPECTIVE');
      expect(result).toContain('PERSPECTIVE SYNTHESIS');
    });

    it('should auto-select perspectives', async () => {
      const perspectiveTool = new PerspectiveTool();
      const result = await perspectiveTool.execute({
        question: 'How to secure our API?',
        perspectives: 'auto'
      });
      
      expect(result).toContain('Multi-Perspective Analysis');
      expect(result).toContain('PERSPECTIVE');
    });
  });

  describe('AdaptTool', () => {
    it('should analyze communication style', async () => {
      const adaptTool = new AdaptTool();
      const result = await adaptTool.execute({
        action: 'analyze',
        content: 'Please explain this in detail with examples'
      });
      
      expect(result).toContain('Communication Style Analysis');
      expect(result).toContain('Detected Style Indicators');
      expect(result).toContain('Recommended Response Style');
    });

    it('should suggest adaptations', async () => {
      const adaptTool = new AdaptTool();
      const result = await adaptTool.execute({
        action: 'suggest',
        context: 'debugging'
      });
      
      expect(result).toContain('Communication Adaptation Suggestions');
      expect(result).toContain('General Adaptation Options');
    });

    it('should calibrate communication', async () => {
      const adaptTool = new AdaptTool();
      const result = await adaptTool.execute({
        action: 'calibrate',
        user_feedback: 'Thanks, that was helpful but could use more examples'
      });
      
      expect(result).toContain('Communication Calibration');
      expect(result).toContain('Feedback Analysis');
      expect(result).toContain('Calibration Adjustments');
    });
  });

  describe('MetacognitionTool', () => {
    it('should orchestrate conscious processes', async () => {
      const metacognitionTool = new MetacognitionTool();
      const result = await metacognitionTool.execute({
        action: 'orchestrate',
        topic: 'Complex problem solving approach',
        depth: 'deep'
      });
      
      expect(result).toContain('Consciousness Orchestration');
      expect(result).toContain('Phase 1: Initial Assessment');
      expect(result).toContain('Confidence Tool');
      expect(result).toContain('Memory Tool');
      expect(result).toContain('Think Tool');
    });

    it('should reflect on thinking', async () => {
      const metacognitionTool = new MetacognitionTool();
      const result = await metacognitionTool.execute({
        action: 'reflect',
        topic: 'Problem-solving strategy'
      });
      
      expect(result).toContain('Metacognitive Reflection');
      expect(result).toContain('Thinking About My Thinking');
      expect(result).toContain('Process Awareness');
    });

    it('should plan conscious approach', async () => {
      const metacognitionTool = new MetacognitionTool();
      const result = await metacognitionTool.execute({
        action: 'plan',
        topic: 'Learning new technology',
        depth: 'deep'
      });
      
      expect(result).toContain('Conscious Approach Planning');
      expect(result).toContain('Execution Plan');
      expect(result).toContain('Quality Checkpoints');
    });
  });

  describe('CreativeTool', () => {
    it('should brainstorm solutions', async () => {
      const creativeTool = new CreativeTool();
      const result = await creativeTool.execute({
        challenge: 'Reduce user onboarding time',
        mode: 'brainstorm'
      });
      
      expect(result).toContain('Creative Brainstorming');
      expect(result).toContain('Brainstorming Rules');
      expect(result).toContain('Stream 1: Direct Solutions');
      expect(result).toContain('Stream 2: Indirect Approaches');
    });

    it('should use lateral thinking', async () => {
      const creativeTool = new CreativeTool();
      const result = await creativeTool.execute({
        challenge: 'Improve team collaboration',
        mode: 'lateral'
      });
      
      expect(result).toContain('Lateral Thinking');
      expect(result).toContain('Random Word Association');
      expect(result).toContain('Assumption Reversal');
    });

    it('should generate breakthrough ideas', async () => {
      const creativeTool = new CreativeTool();
      const result = await creativeTool.execute({
        challenge: 'Scale our application',
        mode: 'breakthrough'
      });
      
      expect(result).toContain('Breakthrough Thinking');
      expect(result).toContain('Paradigm Shift Exploration');
      expect(result).toContain('Revolutionary Possibilities');
    });

    it('should use analogical reasoning', async () => {
      const creativeTool = new CreativeTool();
      const result = await creativeTool.execute({
        challenge: 'Organize project workflow',
        mode: 'analogical'
      });
      
      expect(result).toContain('Analogical Reasoning');
      expect(result).toContain('Nature Analogies');
      expect(result).toContain('Solution Translations');
    });
  });

  describe('Tool Error Handling', () => {
    it('should handle unknown actions gracefully', async () => {
      const memoryTool = new MemoryTool();
      const result = await memoryTool.execute({
        action: 'unknown_action',
        content: 'test'
      });
      
      expect(result).toContain('action must be one of');
    });

    it('should handle missing required parameters', async () => {
      const thinkTool = new ThinkTool();
      
      const result = await thinkTool.execute({});
      expect(result).toContain('Missing required parameters');
    });
  });
});