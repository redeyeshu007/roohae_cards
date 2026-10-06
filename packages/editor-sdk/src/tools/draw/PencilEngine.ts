/**
 * FILE PURPOSE:
 * Freehand Pencil drawing engine for Roohae Editor.
 *
 * MAIN RESPONSIBILITY:
 * Provides thin, responsive, sketch-like strokes with rounded caps on the Fabric canvas.
 *
 * CONNECTED SYSTEMS:
 * - packages/editor-sdk/src/tools/common/ToolManager.ts (registered as 'draw-pencil')
 * - packages/ui/src/editor/ToolsPanel.tsx (activated when user clicks Pencil in Draw tool subpanel)
 */

import { BaseDrawEngine } from './BaseDrawEngine';
import { ToolContext } from '../common/BaseTool';

// DRAW TOOL:
// Pencil
//
// PURPOSE:
// Enables freehand pencil sketching with thin, pressure-sensitive strokes on the canvas.
//
// CONNECTION:
// Tool selection (ToolsPanel)
// → drawing mode (BaseDrawTool.activate())
// → canvas pointer events (pointerdown / pointermove / pointerup)
// → drawing object (Fabric.Path committed to canvas and history)
export class PencilEngine extends BaseDrawEngine {
  constructor(context: ToolContext) {
    super('draw-pencil', context);
    this.config = { ...this.config, thickness: 2, opacity: 1 };
  }
}

