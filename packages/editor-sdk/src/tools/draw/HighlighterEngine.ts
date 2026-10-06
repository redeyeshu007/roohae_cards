/**
 * FILE PURPOSE:
 * Semi-transparent highlighter drawing engine with multiply blend mode.
 *
 * MAIN RESPONSIBILITY:
 * Emulates fluorescent office highlighters using flat square chisel tips, semi-transparent pigments,
 * and CSS/Canvas 'multiply' global composite operations so highlighted underlying text remains visible.
 *
 * CONNECTED SYSTEMS:
 * - packages/editor-sdk/src/tools/common/ToolManager.ts (manages highlighter)
 * - packages/ui/src/editor/ToolsPanel.tsx (Draw > Highlighter tool)
 */

import { Path } from 'fabric';
import { BaseDrawEngine } from './BaseDrawEngine';
import { ToolContext } from '../common/BaseTool';

/**
 * HighlighterEngine - wide, semi-transparent strokes with flat tips. 
 * Uses multiply blend mode to simulate a real highlighter.
 */
// DRAW TOOL: HIGHLIGHTER
// Renders semi-translucent wide chisel stroke with multiply blending.
export class HighlighterEngine extends BaseDrawEngine {

  constructor(context: ToolContext) {
    super('draw-highlighter', context);
    this.config = { ...this.config, thickness: 20, opacity: 0.35, color: '#FFEB3B' };
  }

  protected override getInitialPathOptions(): any {
    return {
      ...super.getInitialPathOptions(),
      strokeLineCap: 'square',
      strokeLineJoin: 'miter',
      opacity: this.config.opacity,
      globalCompositeOperation: 'multiply',
    };
  }

  protected override applyStrokeStyle(path: Path, pressure: number = 1): void {
    // Highlighter has constant width - no pressure variation
    const width = Math.max(15, this.config.thickness);
    path.set({ strokeWidth: width, stroke: this.config.color, opacity: this.config.opacity });
  }

  protected override formatPath(path: any): void {
    super.formatPath(path);
    path.set({ globalCompositeOperation: 'multiply' });
  }
}
