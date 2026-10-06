/**
 * FILE PURPOSE:
 * Precision technical ink pen drawing engine with crisp vector geometry.
 *
 * MAIN RESPONSIBILITY:
 * Produces crisp, non-variable strokes with butt line caps and miter joints for architectural or clean vector line work.
 *
 * CONNECTED SYSTEMS:
 * - packages/editor-sdk/src/tools/common/ToolManager.ts (manages pen tool)
 * - packages/ui/src/editor/ToolsPanel.tsx (Draw > Pen tool)
 */

import { Path } from 'fabric';
import { BaseDrawEngine } from './BaseDrawEngine';
import { ToolContext } from '../common/BaseTool';

/**
 * DrawPenEngine - solid pen with square caps and miter joins for crisp lines.
 */
// DRAW TOOL: TECHNICAL PEN
// Emulates solid fountain or technical drawing pen with constant stroke geometry.
export class DrawPenEngine extends BaseDrawEngine {

  constructor(context: ToolContext) {
    super('draw-pen', context);
    this.config = { ...this.config, thickness: 3, opacity: 1 };
  }

  protected override getInitialPathOptions(): any {
    return {
      ...super.getInitialPathOptions(),
      strokeLineCap: 'butt',
      strokeLineJoin: 'miter',
    };
  }

  protected override applyStrokeStyle(path: Path, pressure: number = 1): void {
    // Pen has constant width - no pressure variation
    path.set({ strokeWidth: this.config.thickness, stroke: this.config.color, opacity: this.config.opacity });
  }
}
