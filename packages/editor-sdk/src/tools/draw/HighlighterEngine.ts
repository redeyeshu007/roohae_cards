import { Path } from 'fabric';
import { BaseDrawEngine } from './BaseDrawEngine';
import { ToolContext } from '../common/BaseTool';

/**
 * HighlighterEngine - wide, semi-transparent strokes with flat tips. 
 * Uses multiply blend mode to simulate a real highlighter.
 */
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
