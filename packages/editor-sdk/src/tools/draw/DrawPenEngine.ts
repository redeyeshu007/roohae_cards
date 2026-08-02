import { Path } from 'fabric';
import { BaseDrawEngine } from './BaseDrawEngine';
import { ToolContext } from '../common/BaseTool';

/**
 * DrawPenEngine - solid pen with square caps and miter joins for crisp lines.
 */
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
