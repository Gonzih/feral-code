import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rm } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { SessionManager } from '../src/utils/session.js';

describe('SessionManager', () => {
  let sessionManager: SessionManager;
  const testSessionsDir = join(homedir(), '.feral-code', 'sessions');

  beforeEach(() => {
    sessionManager = new SessionManager();
  });

  afterEach(async () => {
    // Clean up test sessions
    try {
      await rm(testSessionsDir, { recursive: true, force: true });
    } catch (error) {
      // Directory might not exist
    }
  });

  describe('Session Creation', () => {
    it('should create a new session with default title', async () => {
      const session = await sessionManager.createSession('openai', 'gpt-4-turbo-preview');
      
      expect(session.id).toBeDefined();
      expect(session.title).toContain('Session');
      expect(session.provider).toBe('openai');
      expect(session.model).toBe('gpt-4-turbo-preview');
      expect(session.messages).toHaveLength(0);
      expect(session.created).toBeInstanceOf(Date);
      expect(session.updated).toBeInstanceOf(Date);
    });

    it('should create a session with custom title', async () => {
      const session = await sessionManager.createSession('openai', 'gpt-4', 'My Custom Session');
      
      expect(session.title).toBe('My Custom Session');
    });

    it('should generate unique session IDs', async () => {
      const session1 = await sessionManager.createSession('openai');
      const session2 = await sessionManager.createSession('openai');
      
      expect(session1.id).not.toBe(session2.id);
    });
  });

  describe('Session Loading and Saving', () => {
    it('should save and load sessions', async () => {
      const originalSession = await sessionManager.createSession('openai', 'gpt-4-turbo-preview', 'Test Session');
      
      // Create a new session manager to test loading
      const newSessionManager = new SessionManager();
      const loadedSession = await newSessionManager.loadSession(originalSession.id);
      
      expect(loadedSession).not.toBeNull();
      expect(loadedSession?.id).toBe(originalSession.id);
      expect(loadedSession?.title).toBe('Test Session');
      expect(loadedSession?.provider).toBe('openai');
    });

    it('should return null for non-existent session', async () => {
      const session = await sessionManager.loadSession('non-existent-id');
      expect(session).toBeNull();
    });

    it('should update session timestamps on save', async () => {
      const session = await sessionManager.createSession('openai');
      const originalUpdated = session.updated;
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await sessionManager.saveSession(session);
      
      expect(session.updated.getTime()).toBeGreaterThan(originalUpdated.getTime());
    });
  });

  describe('Message Management', () => {
    it('should add messages to current session', async () => {
      await sessionManager.createSession('openai');
      
      await sessionManager.addMessage({ role: 'user', content: 'Hello' });
      await sessionManager.addMessage({ role: 'assistant', content: 'Hi there!' });
      
      const session = sessionManager.getCurrentSession();
      expect(session?.messages).toHaveLength(2);
      expect(session?.messages[0].content).toBe('Hello');
      expect(session?.messages[1].content).toBe('Hi there!');
    });

    it('should throw error when adding message without active session', async () => {
      await expect(sessionManager.addMessage({ role: 'user', content: 'Test' }))
        .rejects.toThrow('No active session');
    });
  });

  describe('Session Listing', () => {
    it('should list sessions sorted by update time', async () => {
      const session1 = await sessionManager.createSession('openai', undefined, 'First Session');
      await new Promise(resolve => setTimeout(resolve, 10)); // Ensure different timestamps
      const session2 = await sessionManager.createSession('openai', undefined, 'Second Session');
      
      const sessions = await sessionManager.listSessions();
      
      expect(sessions).toHaveLength(2);
      expect(sessions[0].id).toBe(session2.id); // Most recent first
      expect(sessions[1].id).toBe(session1.id);
    });

    it('should return empty array when no sessions exist', async () => {
      const sessions = await sessionManager.listSessions();
      expect(sessions).toHaveLength(0);
    });
  });

  describe('Session Utilities', () => {
    it('should update session title', async () => {
      await sessionManager.createSession('openai', undefined, 'Original Title');
      
      await sessionManager.updateSessionTitle('Updated Title');
      
      const session = sessionManager.getCurrentSession();
      expect(session?.title).toBe('Updated Title');
    });

    it('should get most recent session', async () => {
      const session1 = await sessionManager.createSession('openai', undefined, 'First');
      await new Promise(resolve => setTimeout(resolve, 50)); // Increase delay
      const session2 = await sessionManager.createSession('openai', undefined, 'Second');
      
      const recent = await sessionManager.getMostRecentSession();
      expect(recent?.title).toBe('Second'); // Check title instead of ID for more reliable test
    });

    it('should return null when no sessions exist for most recent', async () => {
      const recent = await sessionManager.getMostRecentSession();
      expect(recent).toBeNull();
    });
  });

  describe('Session Export', () => {
    it('should export session as JSON', async () => {
      const session = await sessionManager.createSession('openai', 'gpt-4-turbo-preview', 'Export Test');
      await sessionManager.addMessage({ role: 'user', content: 'Test message' });
      await sessionManager.addMessage({ role: 'assistant', content: 'Test response' });
      
      const exported = await sessionManager.exportSession(session.id, 'json');
      const parsed = JSON.parse(exported);
      
      expect(parsed.title).toBe('Export Test');
      expect(parsed.provider).toBe('openai');
      expect(parsed.messages).toHaveLength(2);
    });

    it('should export session as Markdown', async () => {
      const session = await sessionManager.createSession('openai', 'gpt-4-turbo-preview', 'Markdown Test');
      await sessionManager.addMessage({ role: 'user', content: 'Hello' });
      await sessionManager.addMessage({ role: 'assistant', content: 'Hi there!' });
      
      const exported = await sessionManager.exportSession(session.id, 'markdown');
      
      expect(exported).toContain('# Markdown Test');
      expect(exported).toContain('**Provider:** openai');
      expect(exported).toContain('**Model:** gpt-4-turbo-preview');
      expect(exported).toContain('## User');
      expect(exported).toContain('Hello');
      expect(exported).toContain('## Assistant');
      expect(exported).toContain('Hi there!');
    });

    it('should throw error for non-existent session export', async () => {
      await expect(sessionManager.exportSession('non-existent', 'json'))
        .rejects.toThrow('Session not found');
    });
  });

  describe('Session Deletion', () => {
    it('should mark session for deletion when it exists', async () => {
      const session = await sessionManager.createSession('openai');
      
      const result = await sessionManager.deleteSession(session.id);
      expect(result).toBe(true);
    });

    it('should return false for non-existent session deletion', async () => {
      const result = await sessionManager.deleteSession('non-existent');
      expect(result).toBe(false);
    });
  });
});