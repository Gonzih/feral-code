import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { homedir } from 'os';

export interface DiagnosticEvent {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  category: 'tool' | 'provider' | 'session' | 'system' | 'mcp' | 'cost';
  message: string;
  data?: any;
  stack?: string;
}

export class DiagnosticsManager {
  private diagnosticPath: string;
  private maxLogSize = 1024 * 1024; // 1MB
  private maxLogs = 1000;

  constructor() {
    this.diagnosticPath = join(homedir(), '.feral-code', 'diagnostics.json');
  }

  async log(event: Omit<DiagnosticEvent, 'timestamp'>): Promise<void> {
    const fullEvent: DiagnosticEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    try {
      await this.ensureLogFile();
      const logs = await this.readLogs();
      logs.push(fullEvent);

      // Rotate logs if needed
      if (logs.length > this.maxLogs) {
        logs.splice(0, logs.length - this.maxLogs);
      }

      await this.writeLogs(logs);
    } catch (error) {
      // Fail silently to avoid infinite loops
      console.error('Failed to write diagnostic log:', error);
    }
  }

  async info(category: DiagnosticEvent['category'], message: string, data?: any): Promise<void> {
    await this.log({ level: 'info', category, message, data });
  }

  async warn(category: DiagnosticEvent['category'], message: string, data?: any): Promise<void> {
    await this.log({ level: 'warn', category, message, data });
  }

  async error(category: DiagnosticEvent['category'], message: string, error?: Error, data?: any): Promise<void> {
    await this.log({
      level: 'error',
      category,
      message,
      data,
      stack: error?.stack,
    });
  }

  async debug(category: DiagnosticEvent['category'], message: string, data?: any): Promise<void> {
    await this.log({ level: 'debug', category, message, data });
  }

  async getDiagnostics(options?: {
    level?: DiagnosticEvent['level'];
    category?: DiagnosticEvent['category'];
    since?: string;
    limit?: number;
  }): Promise<DiagnosticEvent[]> {
    try {
      const logs = await this.readLogs();
      let filtered = logs;

      if (options?.level) {
        filtered = filtered.filter(log => log.level === options.level);
      }

      if (options?.category) {
        filtered = filtered.filter(log => log.category === options.category);
      }

      if (options?.since) {
        const sinceDate = new Date(options.since);
        filtered = filtered.filter(log => new Date(log.timestamp) >= sinceDate);
      }

      if (options?.limit) {
        filtered = filtered.slice(-options.limit);
      }

      return filtered.reverse(); // Most recent first
    } catch (error) {
      return [];
    }
  }

  async getSystemInfo(): Promise<any> {
    const { platform, arch, version } = process;
    const nodeVersion = process.version;
    const memory = process.memoryUsage();

    return {
      platform,
      arch,
      version,
      nodeVersion,
      memory: {
        rss: Math.round(memory.rss / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memory.heapTotal / 1024 / 1024) + 'MB',
        heapUsed: Math.round(memory.heapUsed / 1024 / 1024) + 'MB',
        external: Math.round(memory.external / 1024 / 1024) + 'MB',
      },
      uptime: Math.round(process.uptime()) + 's',
      pid: process.pid,
      cwd: process.cwd(),
      env: {
        nodeEnv: process.env.NODE_ENV,
        provider: process.env.OPEN_CODE_PROVIDER,
        hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY,
      },
    };
  }

  async clearDiagnostics(): Promise<void> {
    try {
      await this.writeLogs([]);
    } catch (error) {
      // Fail silently
    }
  }

  private async ensureLogFile(): Promise<void> {
    try {
      await mkdir(dirname(this.diagnosticPath), { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  private async readLogs(): Promise<DiagnosticEvent[]> {
    try {
      const content = await readFile(this.diagnosticPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return [];
    }
  }

  private async writeLogs(logs: DiagnosticEvent[]): Promise<void> {
    const content = JSON.stringify(logs, null, 2);
    await writeFile(this.diagnosticPath, content, 'utf-8');
  }
}

// Global diagnostics instance
export const diagnostics = new DiagnosticsManager();