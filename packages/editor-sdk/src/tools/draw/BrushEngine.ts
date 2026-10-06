/**
 * FILE PURPOSE:
 * Artistic watercolor/acrylic paint brush engine with soft radial stamps.
 *
 * MAIN RESPONSIBILITY:
 * Emulates natural bristle paint blending by stamping soft radial gradients onto an offscreen canvas
 * at 60 FPS, then baking the bounding box into a persistent FabricImage object.
 *
 * CONNECTED SYSTEMS:
 * - packages/editor-sdk/src/tools/common/ToolManager.ts (manages brush activation)
 * - packages/ui/src/editor/ToolsPanel.tsx (Draw > Brush tool)
 */

import { Image as FabricImage, Point } from 'fabric';
import { BaseDrawTool } from './BaseDrawTool';
import { ToolContext } from '../common/BaseTool';
import { distance } from './utils';

// DRAW TOOL: BRUSH
// Simulates continuous painterly stroke stamping with pressure-sensitive radii.
export class BrushEngine extends BaseDrawTool {

  private isDrawing = false;
  private offscreenCanvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private lastPoint: Point | null = null;
  private minX = 0;
  private minY = 0;
  private maxX = 0;
  private maxY = 0;
  private previewImage: FabricImage | null = null;

  constructor(context: ToolContext) {
    super('draw-brush', context);
    this.config.thickness = 16;
    this.config.flow = 0.6;
  }

  protected override pointerDown(e: any): void {
    this.canvas.discardActiveObject();
    const pointer = e.scenePoint || this.canvas.getScenePoint(e.e);
    this.isDrawing = true;

    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = this.editor.document.width;
    this.offscreenCanvas.height = this.editor.document.height;
    this.ctx = this.offscreenCanvas.getContext('2d')!;

    this.lastPoint = new Point(pointer.x, pointer.y);
    this.minX = pointer.x;
    this.minY = pointer.y;
    this.maxX = pointer.x;
    this.maxY = pointer.y;

    // Attach offscreen canvas directly to FabricImage for real-time 60FPS rendering
    this.previewImage = new FabricImage(this.offscreenCanvas, {
      left: 0,
      top: 0,
      selectable: false,
      evented: false,
      hasControls: false,
      hasBorders: false,
    });
    this.canvas.add(this.previewImage);

    this.drawStamp(pointer, e.e?.pressure ?? 0.5);
    this.canvas.requestRenderAll();
  }

  protected override pointerMove(e: any): void {
    if (!this.isDrawing || !this.lastPoint) return;
    const pointer = e.scenePoint || this.canvas.getScenePoint(e.e);
    const pressure = e.e?.pressure ?? 0.5;

    const dist = distance(this.lastPoint, pointer);
    const step = Math.max(1, this.config.thickness / 4);

    for (let i = 0; i < dist; i += step) {
      const t = i / dist;
      const x = this.lastPoint.x + (pointer.x - this.lastPoint.x) * t;
      const y = this.lastPoint.y + (pointer.y - this.lastPoint.y) * t;
      this.drawStamp(new Point(x, y), pressure);
    }

    this.lastPoint = new Point(pointer.x, pointer.y);
    this.canvas.requestRenderAll();
  }

  protected override pointerUp(e: any): void {
    if (this.isDrawing) {
      this.isDrawing = false;
      this.finalizeStroke();
    }
  }

  private drawStamp(p: Point, pressure: number): void {
    const width = Math.max(2, this.config.thickness * (0.5 + pressure * 0.8));
    const opacity = Math.max(0.1, (this.config.flow || 0.6) * (0.5 + pressure * 0.5));

    this.minX = Math.min(this.minX, p.x - width);
    this.minY = Math.min(this.minY, p.y - width);
    this.maxX = Math.max(this.maxX, p.x + width);
    this.maxY = Math.max(this.maxY, p.y + width);

    const grad = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, width / 2);
    const rgb = this.hexToRgb(this.config.color);
    grad.addColorStop(0, `rgba(${rgb}, ${opacity})`);
    grad.addColorStop(1, `rgba(${rgb}, 0)`);

    this.ctx.fillStyle = grad;
    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y, width / 2, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `${parseInt(result[1] as string, 16)}, ${parseInt(result[2] as string, 16)}, ${parseInt(result[3] as string, 16)}`
      : '0, 0, 0';
  }

  private finalizeStroke(): void {
    if (this.previewImage) {
      this.canvas.remove(this.previewImage);
      this.previewImage = null;
    }

    const w = this.maxX - this.minX;
    const h = this.maxY - this.minY;
    if (w <= 0 || h <= 0) return;

    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = w;
    cropCanvas.height = h;
    const cropCtx = cropCanvas.getContext('2d')!;
    cropCtx.drawImage(this.offscreenCanvas, this.minX, this.minY, w, h, 0, 0, w, h);

    FabricImage.fromURL(cropCanvas.toDataURL()).then(img => {
      img.set({
        left: this.minX,
        top: this.minY,
        opacity: this.config.opacity,
        selectable: false,
        evented: false,
        hasControls: false,
        hasBorders: false,
        roohAssetType: 'draw',
        roohDrawStyle: 'draw-brush',
      } as any);
      this.canvas.add(img);
      this.editor.commit();
    });
  }
}
