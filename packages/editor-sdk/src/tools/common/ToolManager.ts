/**
 * FILE PURPOSE:
 * Central registry and lifecycle coordinator for editor tools.
 *
 * MAIN RESPONSIBILITY:
 * Registers tool instances, handles exclusive tool activation and deactivation teardown,
 * tracks active tool state, and broadcasts property updates to active tools.
 *
 * CONNECTED SYSTEMS:
 * - packages/editor-sdk/src/RoohaeEditor.ts (owns and delegates tool actions to ToolManager)
 * - packages/ui/src/editor/ToolsPanel.tsx (switches tools through editor methods)
 */

import { BaseTool, ToolContext } from './BaseTool';

// TOOL REGISTRY MANAGER:
// Coordinates single-active-tool execution across draw, pen, shapes, sticky notes, etc.
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
