/**
 * FILE PURPOSE:
 * Node-based vector pen tool for precision polygonal path construction.
 *
 * MAIN RESPONSIBILITY:
 * Allows authors to plot anchor points on canvas clicks ('M' and 'L' SVG commands),
 * provides interactive line segment previewing, and finalizes editable vector paths on double-click.
 *
 * CONNECTED SYSTEMS:
 * - packages/editor-sdk/src/tools/common/ToolManager.ts (manages pen tool)
 * - packages/ui/src/editor/ToolsPanel.tsx (Tools > Pen tool)
 */

import { Path, Point } from 'fabric';
import { BaseTool, ToolContext } from '../common/BaseTool';

// TOOL: VECTOR PEN
// Point-by-point Bézier / polygonal vector path creator.
export class PenEngine extends BaseTool {

  private isDrawing = false;
  private pathData: any[] = [];
  private activePath: Path | null = null;
  private currentPoint: Point | null = null;

  private boundOnMouseDown: (e: any) => void;
  private boundOnMouseMove: (e: any) => void;
  private boundOnDblClick: (e: any) => void;

  constructor(context: ToolContext) {
    super('pen', context);
    this.boundOnMouseDown = this.onMouseDown.bind(this);
    this.boundOnMouseMove = this.onMouseMove.bind(this);
    this.boundOnDblClick = this.onDblClick.bind(this);
  }

  activate(config?: any): void {
    this.canvas.defaultCursor = 'crosshair';
    this.canvas.selection = false;
    this.canvas.on('mouse:down', this.boundOnMouseDown);
    this.canvas.on('mouse:move', this.boundOnMouseMove);
    this.canvas.on('mouse:dblclick', this.boundOnDblClick);
  }

  deactivate(): void {
    this.canvas.defaultCursor = 'default';
    this.canvas.selection = true;
    this.canvas.off('mouse:down', this.boundOnMouseDown);
    this.canvas.off('mouse:move', this.boundOnMouseMove);
    this.canvas.off('mouse:dblclick', this.boundOnDblClick);
    this.finishPath();
  }

  private onMouseDown(e: any): void {
    const pointer = this.canvas.getScenePoint(e.e);
    if (!this.isDrawing) {
      this.isDrawing = true;
      this.pathData = [['M', pointer.x, pointer.y]];
      this.activePath = new Path(this.pathData as any, {
        fill: '',
        stroke: 'black',
        strokeWidth: 2,
        selectable: false,
        evented: false,
        roohAssetType: 'pen',
      });
      this.canvas.add(this.activePath);
    } else {
      this.pathData.push(['L', pointer.x, pointer.y]);
      if (this.activePath) {
        // In fabric v6, modifying path array directly and calling setDimensions/dirty is needed
        this.activePath.set({ path: this.pathData as any });
        this.activePath.setCoords();
      }
    }
    this.currentPoint = new Point(pointer.x, pointer.y);
    this.canvas.requestRenderAll();
  }

  private onMouseMove(e: any): void {
    if (!this.isDrawing || !this.activePath || !this.currentPoint) return;
    const pointer = this.canvas.getScenePoint(e.e);
    
    // Preview the next line segment
    const previewData = [...this.pathData, ['L', pointer.x, pointer.y]];
    this.activePath.set({ path: previewData as any });
    this.canvas.requestRenderAll();
  }

  private onDblClick(e: any): void {
    this.finishPath();
  }

  private finishPath(): void {
    if (this.isDrawing && this.activePath) {
      // Remove the last moving segment preview
      this.activePath.set({ path: this.pathData as any });
      this.activePath.set({ selectable: true, evented: true });
      this.activePath.setCoords();
      this.editor.commit();
    }
    this.isDrawing = false;
    this.activePath = null;
    this.currentPoint = null;
    this.pathData = [];
  }
}
