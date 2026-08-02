import { Canvas } from 'fabric';
import { RoohaeEditor } from '../../RoohaeEditor';

export interface ToolContext {
  canvas: Canvas;
  editor: RoohaeEditor;
}

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
