import { BaseTool } from './base.js';
import { Config } from '../types/index.js';
import { BashTool } from './bash.js';
import { ReadTool } from './read.js';
import { WriteTool } from './write.js';
import { EditTool } from './edit.js';
import { MultiEditTool } from './multiEdit.js';
import { GlobTool } from './glob.js';
import { GrepTool } from './grep.js';
import { LSTool } from './ls.js';
import { TodoReadTool } from './todoRead.js';
import { TodoWriteTool } from './todoWrite.js';
import { WebFetchTool } from './webFetch.js';
import { WebSearchTool } from './webSearch.js';
import { NotebookReadTool } from './notebookRead.js';
import { NotebookEditTool } from './notebookEdit.js';
import { AgentTool } from './agent.js';
import { ExitPlanModeTool } from './exitPlanMode.js';
import { MCPSearchTool } from './mcpSearch.js';
import { MCPManagerTool } from './mcpManager.js';
import { ThinkTool } from './think.js';
import { MemoryTool } from './memory.js';
import { ConfidenceTool } from './confidence.js';
import { PerspectiveTool } from './perspective.js';
import { AdaptTool } from './adapt.js';
import { MetacognitionTool } from './metacognition.js';
import { CreativeTool } from './creative.js';

export { 
  BaseTool, 
  BashTool, 
  ReadTool, 
  WriteTool, 
  EditTool, 
  MultiEditTool, 
  GlobTool, 
  GrepTool, 
  LSTool,
  TodoReadTool,
  TodoWriteTool,
  WebFetchTool,
  WebSearchTool,
  NotebookReadTool,
  NotebookEditTool,
  AgentTool,
  ExitPlanModeTool,
  MCPSearchTool,
  MCPManagerTool,
  ThinkTool,
  MemoryTool,
  ConfidenceTool,
  PerspectiveTool,
  AdaptTool,
  MetacognitionTool,
  CreativeTool
};

export class ToolManager {
  private tools: Map<string, BaseTool> = new Map();

  constructor() {
    this.registerTool(new BashTool());
    this.registerTool(new ReadTool());
    this.registerTool(new WriteTool());
    this.registerTool(new EditTool());
    this.registerTool(new MultiEditTool());
    this.registerTool(new GlobTool());
    this.registerTool(new GrepTool());
    this.registerTool(new LSTool());
    this.registerTool(new TodoReadTool());
    this.registerTool(new TodoWriteTool());
    this.registerTool(new WebFetchTool());
    this.registerTool(new WebSearchTool());
    this.registerTool(new NotebookReadTool());
    this.registerTool(new NotebookEditTool());
    this.registerTool(new AgentTool());
    this.registerTool(new ExitPlanModeTool());
    this.registerTool(new MCPSearchTool());
    this.registerTool(new MCPManagerTool());
    this.registerTool(new ThinkTool());
    this.registerTool(new MemoryTool());
    this.registerTool(new ConfidenceTool());
    this.registerTool(new PerspectiveTool());
    this.registerTool(new AdaptTool());
    this.registerTool(new MetacognitionTool());
    this.registerTool(new CreativeTool());
  }

  registerTool(tool: BaseTool): void {
    this.tools.set(tool.name, tool);
  }

  getTool(name: string): BaseTool | undefined {
    return this.tools.get(name);
  }

  getAllTools(): BaseTool[] {
    return Array.from(this.tools.values());
  }

  getToolDefinitions(): Array<{ name: string; description: string; parameters: Record<string, any> }> {
    return this.getAllTools().map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: {
        type: 'object',
        properties: this.convertParameters(tool.parameters),
        required: Object.entries(tool.parameters)
          .filter(([, def]) => def.required)
          .map(([name]) => name),
      },
    }));
  }

  private convertParameters(params: Record<string, any>): Record<string, any> {
    const converted: Record<string, any> = {};
    
    for (const [key, param] of Object.entries(params)) {
      converted[key] = {
        type: param.type,
        description: param.description,
      };
      
      if (param.enum) {
        converted[key].enum = param.enum;
      }
    }
    
    return converted;
  }

  setConfig(config: Config): void {
    for (const tool of this.tools.values()) {
      tool.setConfig(config);
    }
  }

  async executeTool(name: string, parameters: Record<string, any>): Promise<string> {
    const tool = this.getTool(name);
    if (!tool) {
      throw new Error(`Tool '${name}' not found`);
    }

    return await tool.execute(parameters);
  }
}