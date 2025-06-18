import { readFile } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { BaseTool } from './base.js';

interface TodoItem {
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  created: string;
  updated: string;
}

export class TodoReadTool extends BaseTool {
  name = 'TodoRead';
  description = 'Read the current to-do list for the session. Use this tool proactively and frequently to ensure awareness of task status.';
  parameters = {};

  private get todoPath(): string {
    return join(homedir(), '.amai-code', 'todos.json');
  }

  async _execute(params: Record<string, any>): Promise<string> {
    
    try {
      const content = await readFile(this.todoPath, 'utf-8');
      const todos: TodoItem[] = JSON.parse(content);
      
      if (todos.length === 0) {
        return 'No todos exist yet. Use TodoWrite to create your task list.';
      }
      
      const result = ['Current Todo List:', ''];
      
      // Group by status
      const groups = {
        in_progress: todos.filter(t => t.status === 'in_progress'),
        pending: todos.filter(t => t.status === 'pending'),
        completed: todos.filter(t => t.status === 'completed')
      };
      
      if (groups.in_progress.length > 0) {
        result.push('🔄 IN PROGRESS:');
        groups.in_progress.forEach(todo => {
          result.push(`  ${this.formatTodo(todo)}`);
        });
        result.push('');
      }
      
      if (groups.pending.length > 0) {
        result.push('⏳ PENDING:');
        groups.pending.forEach(todo => {
          result.push(`  ${this.formatTodo(todo)}`);
        });
        result.push('');
      }
      
      if (groups.completed.length > 0) {
        result.push('✅ COMPLETED:');
        groups.completed.forEach(todo => {
          result.push(`  ${this.formatTodo(todo)}`);
        });
      }
      
      const stats = [
        `Total: ${todos.length}`,
        `In Progress: ${groups.in_progress.length}`,
        `Pending: ${groups.pending.length}`,
        `Completed: ${groups.completed.length}`
      ];
      
      result.push('', `Summary: ${stats.join(' | ')}`);
      
      return result.join('\n');
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return 'No todos exist yet. Use TodoWrite to create your task list.';
      }
      return `Error reading todos: ${error.message}`;
    }
  }
  
  private formatTodo(todo: TodoItem): string {
    const priority = todo.priority === 'high' ? '🔴' : 
                    todo.priority === 'medium' ? '🟡' : '🟢';
    return `${priority} [${todo.id}] ${todo.content}`;
  }
}