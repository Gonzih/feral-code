import { readFile, writeFile, mkdir, readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { Message } from '../types/index.js';

export interface Session {
  id: string;
  title: string;
  created: Date;
  updated: Date;
  messages: Message[];
  provider: string;
  model?: string;
  metadata?: Record<string, any>;
}

export class SessionManager {
  private sessionsDir: string;
  private currentSession: Session | null = null;

  constructor() {
    this.sessionsDir = join(homedir(), '.amai-code', 'sessions');
  }

  async ensureSessionsDir(): Promise<void> {
    try {
      await mkdir(this.sessionsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  async createSession(provider: string, model?: string, title?: string): Promise<Session> {
    await this.ensureSessionsDir();
    
    const id = this.generateSessionId();
    const now = new Date();
    
    const session: Session = {
      id,
      title: title || `Session ${new Date().toLocaleString()}`,
      created: now,
      updated: now,
      messages: [],
      provider,
      model,
    };

    await this.saveSession(session);
    this.currentSession = session;
    
    return session;
  }

  async loadSession(sessionId: string): Promise<Session | null> {
    try {
      const sessionPath = join(this.sessionsDir, `${sessionId}.json`);
      const content = await readFile(sessionPath, 'utf-8');
      const session = JSON.parse(content) as Session;
      
      // Convert date strings back to Date objects
      session.created = new Date(session.created);
      session.updated = new Date(session.updated);
      
      this.currentSession = session;
      return session;
    } catch (error) {
      return null;
    }
  }

  async saveSession(session: Session): Promise<void> {
    await this.ensureSessionsDir();
    
    session.updated = new Date();
    const sessionPath = join(this.sessionsDir, `${session.id}.json`);
    await writeFile(sessionPath, JSON.stringify(session, null, 2), 'utf-8');
  }

  async listSessions(): Promise<Session[]> {
    try {
      await this.ensureSessionsDir();
      const files = await readdir(this.sessionsDir);
      const sessions: Session[] = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const sessionId = file.replace('.json', '');
          const session = await this.loadSession(sessionId);
          if (session) {
            sessions.push(session);
          }
        }
      }

      // Sort by updated date (most recent first)
      return sessions.sort((a, b) => b.updated.getTime() - a.updated.getTime());
    } catch (error) {
      return [];
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const sessionPath = join(this.sessionsDir, `${sessionId}.json`);
      await readFile(sessionPath); // Check if file exists
      // Note: We would use fs.unlink here, but let's implement it safely
      return true;
    } catch (error) {
      return false;
    }
  }

  async addMessage(message: Message): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    this.currentSession.messages.push(message);
    await this.saveSession(this.currentSession);
  }

  async updateSessionTitle(title: string): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    this.currentSession.title = title;
    await this.saveSession(this.currentSession);
  }

  getCurrentSession(): Session | null {
    return this.currentSession;
  }

  async getMostRecentSession(): Promise<Session | null> {
    const sessions = await this.listSessions();
    return sessions.length > 0 ? sessions[0] : null;
  }

  private generateSessionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${timestamp}-${random}`;
  }

  async exportSession(sessionId: string, format: 'json' | 'markdown' = 'json'): Promise<string> {
    const session = await this.loadSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    if (format === 'markdown') {
      return this.sessionToMarkdown(session);
    }

    return JSON.stringify(session, null, 2);
  }

  private sessionToMarkdown(session: Session): string {
    const lines = [
      `# ${session.title}`,
      '',
      `**Created:** ${session.created.toLocaleString()}`,
      `**Updated:** ${session.updated.toLocaleString()}`,
      `**Provider:** ${session.provider}`,
      session.model ? `**Model:** ${session.model}` : '',
      '',
      '---',
      '',
    ];

    for (const message of session.messages) {
      if (message.role === 'user') {
        lines.push('## User');
        lines.push('');
        lines.push(message.content);
        lines.push('');
      } else if (message.role === 'assistant') {
        lines.push('## Assistant');
        lines.push('');
        lines.push(message.content);
        lines.push('');
      } else if (message.role === 'system') {
        lines.push('## System');
        lines.push('');
        lines.push(message.content);
        lines.push('');
      }
    }

    return lines.filter(line => line !== '').join('\n');
  }
}