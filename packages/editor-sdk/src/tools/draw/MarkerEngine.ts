/**
 * FILE PURPOSE:
 * Felt-tip marker drawing engine with bold opaque ink strokes.
 *
 * MAIN RESPONSIBILITY:
 * Replicates smooth, thick felt pen marks with rounded joins and gentle pressure-based stroke expansion.
 *
 * CONNECTED SYSTEMS:
 * - packages/editor-sdk/src/tools/common/ToolManager.ts (manages marker tool)
 * - packages/ui/src/editor/ToolsPanel.tsx (Draw > Marker tool)
 */

import { Path } from 'fabric';
import { BaseDrawEngine } from './BaseDrawEngine';
import { ToolContext } from '../common/BaseTool';

/**
 * MarkerEngine - thick, solid, felt-tip marker strokes like Canva.
 */
// DRAW TOOL: FELT-TIP MARKER
// Renders bold opaque strokes with subtle pressure-responsive width dynamics.
export class MarkerEngine extends BaseDrawEngine {

  constructor(context: ToolContext) {
    super('draw-marker', context);
    this.config = { ...this.config, thickness: 12, opacity: 0.95 };
  }

  protected override getInitialPathOptions(): any {
    return {
      ...super.getInitialPathOptions(),
      strokeWidth: this.config.thickness,
      strokeLineCap: 'round',
      strokeLineJoin: 'round',
      opacity: this.config.opacity,
    };
  }

  protected override applyStrokeStyle(path: Path, pressure: number = 1): void {
    const width = Math.max(6, this.config.thickness * (0.8 + pressure * 0.4));
    path.set({ strokeWidth: width, stroke: this.config.color, opacity: this.config.opacity });
  }
}
