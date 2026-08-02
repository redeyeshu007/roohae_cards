import { BaseDrawEngine } from './BaseDrawEngine';
import { ToolContext } from '../common/BaseTool';

/**
 * PencilEngine – thin, pressure‑sensitive strokes with rounded caps.
 * Inherits all pointer handling, throttling, and auto‑selection from BaseDrawEngine.
 */
export class PencilEngine extends BaseDrawEngine {
  constructor(context: ToolContext) {
    super('draw-pencil', context);
    this.config = { ...this.config, thickness: 2, opacity: 1 };
  }
}

