import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { minimatch } from 'minimatch';
import { BaseTool } from './base.js';

export class LSTool extends BaseTool {
  name = 'LS';
  description = 'Lists files and directories in a given path';
  parameters = {
    path: {
      type: 'string',
      description: 'The absolute path to the directory to list (must be absolute, not relative)',
      required: true,
    },
    ignore: {
      type: 'array',
      description: 'List of glob patterns to ignore',
    },
    show_hidden: {
      type: 'boolean',
      description: 'Show hidden files and directories (default: false)',
    },
    details: {
      type: 'boolean',
      description: 'Show detailed information (size, date, permissions)',
    },
  };

  async _execute(params: Record<string, any>): Promise<string> {
    
    const { 
      path, 
      ignore = [], 
      show_hidden = false, 
      details = false 
    } = params;
    
    try {
      const entries = await readdir(path);
      const results: string[] = [];
      
      for (const entry of entries) {
        // Skip hidden files unless requested
        if (!show_hidden && entry.startsWith('.')) {
          continue;
        }
        
        // Check ignore patterns
        const shouldIgnore = ignore.some((pattern: string) => 
          minimatch(entry, pattern)
        );
        if (shouldIgnore) {
          continue;
        }
        
        const fullPath = join(path, entry);
        
        try {
          const stats = await stat(fullPath);
          
          if (details) {
            const size = stats.isDirectory() ? '' : this.formatBytes(stats.size);
            const date = stats.mtime.toISOString().split('T')[0];
            const type = stats.isDirectory() ? 'd' : '-';
            const permissions = this.formatPermissions(stats.mode);
            
            results.push(`${type}${permissions} ${size.padStart(8)} ${date} ${entry}${stats.isDirectory() ? '/' : ''}`);
          } else {
            results.push(`${entry}${stats.isDirectory() ? '/' : ''}`);
          }
        } catch (statError) {
          // If we can't stat the file, just include it without details
          results.push(entry);
        }
      }
      
      if (results.length === 0) {
        return `Directory is empty: ${path}`;
      }
      
      results.sort();
      
      if (details) {
        return `Contents of ${path}:\n${results.join('\n')}`;
      } else {
        return `- ${path}/\n${results.map(r => `  - ${r}`).join('\n')}`;
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return `Directory does not exist: ${path}`;
      }
      if (error.code === 'ENOTDIR') {
        return `Path is not a directory: ${path}`;
      }
      if (error.code === 'EACCES') {
        return `Permission denied: ${path}`;
      }
      return `Error listing directory: ${error.message}`;
    }
  }
  
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'K', 'M', 'G'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i)) + sizes[i];
  }
  
  private formatPermissions(mode: number): string {
    const perms = mode & parseInt('777', 8);
    const owner = (perms >> 6) & 7;
    const group = (perms >> 3) & 7;
    const other = perms & 7;
    
    const formatTriple = (perm: number): string => {
      return (
        (perm & 4 ? 'r' : '-') +
        (perm & 2 ? 'w' : '-') +
        (perm & 1 ? 'x' : '-')
      );
    };
    
    return formatTriple(owner) + formatTriple(group) + formatTriple(other);
  }
}