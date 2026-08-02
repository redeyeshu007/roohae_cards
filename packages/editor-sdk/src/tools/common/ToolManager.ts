import { BaseTool, ToolContext } from './BaseTool';

export class ToolManager {
  private tools = new Map<string, BaseTool>();
  private activeToolId: string | null = null;
  private context: ToolContext;

  constructor(context: ToolContext) {
    this.context = context;
  }

  registerTool(tool: BaseTool): void {
    this.tools.set(tool.id, tool);
  }

  activate(toolId: string | null, config?: any): void {
    if (this.activeToolId === toolId) return;

    if (this.activeToolId) {
      const activeTool = this.tools.get(this.activeToolId);
      activeTool?.deactivate();
    }

    this.activeToolId = toolId;

    if (toolId) {
      const tool = this.tools.get(toolId);
      if (tool) {
        tool.activate(config);
      } else {
        console.warn(`Tool with id ${toolId} not registered.`);
        this.activeToolId = null;
      }
    }
  }

  getActiveToolId(): string | null {
    return this.activeToolId;
  }

  getActiveTool(): BaseTool | null {
    return this.activeToolId ? this.tools.get(this.activeToolId) || null : null;
  }

  updateActiveToolConfig(config: any): void {
    if (this.activeToolId) {
      const tool = this.tools.get(this.activeToolId);
      if (tool && 'updateProperties' in tool) {
        (tool as any).updateProperties(config);
      }
    }
  }
}
