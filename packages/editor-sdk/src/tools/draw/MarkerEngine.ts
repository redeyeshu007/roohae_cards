import { Path } from 'fabric';
import { BaseDrawEngine } from './BaseDrawEngine';
import { ToolContext } from '../common/BaseTool';

/**
 * MarkerEngine - thick, solid, felt-tip marker strokes like Canva.
 */
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
