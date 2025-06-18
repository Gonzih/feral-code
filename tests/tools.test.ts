import { describe, it, expect } from 'vitest';
import { ToolManager, BashTool, ReadTool, WriteTool } from '../src/tools/index.js';

describe('ToolManager', () => {
  it('should register default tools', () => {
    const toolManager = new ToolManager();
    const tools = toolManager.getAllTools();
    
    expect(tools).toHaveLength(25); // Updated for new consciousness tools
    expect(tools.some(tool => tool.name === 'Bash')).toBe(true);
    expect(tools.some(tool => tool.name === 'Read')).toBe(true);
    expect(tools.some(tool => tool.name === 'Write')).toBe(true);
  });

  it('should get tool definitions', () => {
    const toolManager = new ToolManager();
    const definitions = toolManager.getToolDefinitions();
    
    expect(definitions).toHaveLength(25); // Updated for new consciousness tools
    expect(definitions[0]).toHaveProperty('name');
    expect(definitions[0]).toHaveProperty('description');
    expect(definitions[0]).toHaveProperty('parameters');
  });

  it('should throw error for unknown tool', async () => {
    const toolManager = new ToolManager();
    
    await expect(toolManager.executeTool('UnknownTool', {}))
      .rejects.toThrow('Tool \'UnknownTool\' not found');
  });
});

describe('BashTool', () => {
  it('should execute simple commands', async () => {
    const bashTool = new BashTool();
    const result = await bashTool.execute({ command: 'echo "Hello World"' });
    
    expect(result).toContain('Hello World');
  });

  it('should handle command errors', async () => {
    const bashTool = new BashTool();
    const result = await bashTool.execute({ command: 'nonexistentcommand123' });
    
    expect(result).toContain('Command failed');
  });

  it('should validate required parameters', async () => {
    const bashTool = new BashTool();
    
    const result = await bashTool.execute({});
    expect(result).toContain('Error (MISSING_PARAMETERS): Missing required parameters: command');
  });
});

describe('ReadTool', () => {
  it('should validate required parameters', async () => {
    const readTool = new ReadTool();
    
    const result = await readTool.execute({});
    expect(result).toContain('Error (MISSING_PARAMETERS): Missing required parameters: file_path');
  });

  it('should handle non-existent files', async () => {
    const readTool = new ReadTool();
    const result = await readTool.execute({ file_path: '/nonexistent/file.txt' });
    
    expect(result).toContain('File does not exist');
  });
});

describe('WriteTool', () => {
  it('should validate required parameters', async () => {
    const writeTool = new WriteTool();
    
    const result = await writeTool.execute({ file_path: '/tmp/test.txt' });
    expect(result).toContain('Error (MISSING_PARAMETERS): Missing required parameters: content');
      
    const result2 = await writeTool.execute({ content: 'test' });
    expect(result2).toContain('Error (MISSING_PARAMETERS): Missing required parameters: file_path');
  });
});