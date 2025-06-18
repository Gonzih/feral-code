import fg from 'fast-glob';
import { readFile } from 'fs/promises';
import { BaseTool } from './base.js';

export class GrepTool extends BaseTool {
  name = 'Grep';
  description = 'Fast content search tool that works with any codebase size';
  parameters = {
    pattern: {
      type: 'string',
      description: 'The regular expression pattern to search for in file contents',
      required: true,
    },
    include: {
      type: 'string',
      description: 'File pattern to include in the search (e.g. "*.js", "*.{ts,tsx}")',
    },
    path: {
      type: 'string',
      description: 'The directory to search in. Defaults to the current working directory',
    },
    options: {
      type: 'object',
      description: 'Search options (caseSensitive, maxMatches, etc.)',
    },
  };

  async _execute(params: Record<string, any>): Promise<string> {
    
    const { 
      pattern, 
      include = '**/*', 
      path = process.cwd(), 
      options = {} 
    } = params;
    
    try {
      const searchOptions = {
        caseSensitive: true,
        maxMatches: 100,
        showLineNumbers: true,
        ...options,
      };

      const globOptions = {
        cwd: path,
        ignore: ['node_modules/**', '.git/**', '**/node_modules/**', '**/.git/**'],
        dot: false,
        onlyFiles: true,
        absolute: true,
      };

      const files = await fg(include, globOptions);
      const regex = new RegExp(pattern, searchOptions.caseSensitive ? 'g' : 'gi');
      const results: string[] = [];
      let totalMatches = 0;

      if (files.length === 0) {
        return `No files found matching pattern: ${include} in ${path}`;
      }

      for (const file of files) {
        if (totalMatches >= searchOptions.maxMatches) break;

        try {
          const content = await readFile(file, 'utf-8');
          const lines = content.split('\n');
          const matches: string[] = [];

          for (let i = 0; i < lines.length; i++) {
            if (totalMatches >= searchOptions.maxMatches) break;
            
            const line = lines[i];
            regex.lastIndex = 0; // Reset regex state
            if (regex.test(line)) {
              if (searchOptions.showLineNumbers) {
                matches.push(`${i + 1}:${line.trim()}`);
              } else {
                matches.push(line.trim());
              }
              totalMatches++;
            }
          }

          if (matches.length > 0) {
            results.push(`${file}:\n${matches.map(m => `  ${m}`).join('\n')}`);
          }
        } catch (fileError) {
          // Skip files that can't be read (binary, permissions, etc.)
          continue;
        }
      }

      if (results.length === 0) {
        return `No matches found for pattern: ${pattern}`;
      }

      return results.join('\n\n');
    } catch (error: any) {
      return `Error searching content: ${error.message}`;
    }
  }
}