/**
 * FILE PURPOSE:
 * Abstract base class defining the contract and lifecycle for interactive editor tools.
 *
 * MAIN RESPONSIBILITY:
 * Provides standard initialization, access to Fabric canvas and RoohaeEditor instances,
 * and lifecycle hooks (activate, deactivate) for all drawing and authoring tools.
 *
 * CONNECTED SYSTEMS:
 * - packages/editor-sdk/src/tools/common/ToolManager.ts (registers and activates BaseTool instances)
 * - packages/editor-sdk/src/tools/draw/BaseDrawTool.ts (extends BaseTool)
 * - packages/ui/src/editor/ToolsPanel.tsx (switches active tool)
 */

import { Canvas } from 'fabric';
import { RoohaeEditor } from '../../RoohaeEditor';

export interface ToolContext {
  canvas: Canvas;
  editor: RoohaeEditor;
}

// ABSTRACT TOOL CONTRACT:
// Base class implemented by all canvas drawing tools and interactive creation engines.
export abstract class BaseTool {

  protected readonly canvas: Canvas;
  protected readonly editor: RoohaeEditor;
  public readonly id: string;

  constructor(id: string, context: ToolContext) {
    this.id = id;
    this.canvas = context.canvas;
    this.editor = context.editor;
  }

  /** Called when the tool is activated via the Tools Panel. */
  abstract activate(config?: any): void;

  /** Called when switching away from this tool to clean up event listeners. */
  abstract deactivate(): void;
}
