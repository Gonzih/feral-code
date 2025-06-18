import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
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

export class TodoWriteTool extends BaseTool {
  name = 'TodoWrite';
  description = 'Create and manage a structured task list for your current coding session. Use this proactively for complex multi-step tasks.';
  parameters = {
    todos: {
      type: 'array',
      description: 'The updated todo list with items containing id, content, status, and priority',
      required: true,
    },
  };

  private get todoPath(): string {
    return join(homedir(), '.amai-code', 'todos.json');
  }

  async _execute(params: Record<string, any>): Promise<string> {
    
    const { todos } = params;
    
    if (!Array.isArray(todos)) {
      return 'Error: todos must be an array';
    }
    
    // Validate todo items
    for (const todo of todos) {
      if (!todo.id || !todo.content || !todo.status || !todo.priority) {
        return 'Error: Each todo must have id, content, status, and priority';
      }
      
      if (!['pending', 'in_progress', 'completed'].includes(todo.status)) {
        return 'Error: Status must be pending, in_progress, or completed';
      }
      
      if (!['low', 'medium', 'high'].includes(todo.priority)) {
        return 'Error: Priority must be low, medium, or high';
      }
    }
    
    try {
      // Ensure directory exists
      await mkdir(dirname(this.todoPath), { recursive: true });
      
      // Add timestamps
      const now = new Date().toISOString();
      const processedTodos: TodoItem[] = todos.map(todo => ({
        ...todo,
        created: todo.created || now,
        updated: now,
      }));
      
      await writeFile(this.todoPath, JSON.stringify(processedTodos, null, 2), 'utf-8');
      
      const stats = {
        total: processedTodos.length,
        pending: processedTodos.filter(t => t.status === 'pending').length,
        in_progress: processedTodos.filter(t => t.status === 'in_progress').length,
        completed: processedTodos.filter(t => t.status === 'completed').length,
      };
      
      return `Todos updated successfully. ${stats.total} total tasks: ${stats.in_progress} in progress, ${stats.pending} pending, ${stats.completed} completed.`;
    } catch (error: any) {
      return `Error writing todos: ${error.message}`;
    }
  }
}