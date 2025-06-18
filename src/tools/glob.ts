import fg from 'fast-glob';
import { BaseTool } from './base.js';

export class GlobTool extends BaseTool {
  name = 'Glob';
  description = 'Fast file pattern matching tool that works with any codebase size';
  parameters = {
    pattern: {
      type: 'string',
      description: 'The glob pattern to match files against',
      required: true,
    },
    path: {
      type: 'string',
      description: 'The directory to search in. If not specified, the current working directory will be used',
    },
    options: {
      type: 'object',
      description: 'Additional glob options (ignore, absolute, etc.)',
    },
  };

  async _execute(params: Record<string, any>): Promise<string> {
    
    const { pattern, path = process.cwd(), options = {} } = params;
    
    try {
      const defaultOptions = {
        cwd: path,
        ignore: ['node_modules/**', '.git/**', '**/node_modules/**', '**/.git/**'],
        dot: false,
        onlyFiles: true,
        stats: true,
        ...options,
      };

      const files = await fg(pattern, defaultOptions);
      
      if (files.length === 0) {
        return 'No files found';
      }

      // Sort by modification time if stats are available
      if (defaultOptions.stats && Array.isArray(files) && files.length > 0 && typeof files[0] === 'object') {
        const filesWithStats = files as Array<{ path: string; stats: any }>;
        filesWithStats.sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());
        return filesWithStats.map(f => f.path).join('\n');
      }

      return (files as unknown as string[]).sort().join('\n');
    } catch (error: any) {
      return `Error searching files: ${error.message}`;
    }
  }
}