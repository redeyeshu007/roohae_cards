import { Image as FabricImage, Point } from 'fabric';
import { BaseDrawTool } from './BaseDrawTool';
import { ToolContext } from '../common/BaseTool';
import { distance } from './utils';

export class ChalkEngine extends BaseDrawTool {
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
    super('draw-chalk', context);
    this.config.thickness = 14;
    this.config.density = 40;
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

    this.previewImage = new FabricImage(this.offscreenCanvas, {
      left: 0,
      top: 0,
      selectable: false,
      evented: false,
      hasControls: false,
      hasBorders: false,
    });
    this.canvas.add(this.previewImage);

    this.drawChalk(pointer);
    this.canvas.requestRenderAll();
  }

  protected override pointerMove(e: any): void {
    if (!this.isDrawing || !this.lastPoint) return;
    const pointer = e.scenePoint || this.canvas.getScenePoint(e.e);

    const dist = distance(this.lastPoint, pointer);
    const step = Math.max(1, this.config.thickness / 3);

    for (let i = 0; i < dist; i += step) {
      const t = i / dist;
      const x = this.lastPoint.x + (pointer.x - this.lastPoint.x) * t;
      const y = this.lastPoint.y + (pointer.y - this.lastPoint.y) * t;
      this.drawChalk(new Point(x, y));
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

  private drawChalk(p: Point): void {
    const radius = this.config.thickness / 2;
    const density = this.config.density || 40;

    this.minX = Math.min(this.minX, p.x - radius);
    this.minY = Math.min(this.minY, p.y - radius);
    this.maxX = Math.max(this.maxX, p.x + radius);
    this.maxY = Math.max(this.maxY, p.y + radius);

    const rgb = this.hexToRgb(this.config.color);

    for (let i = 0; i < density; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * radius;
      const grainX = p.x + Math.cos(angle) * r;
      const grainY = p.y + Math.sin(angle) * r;
      const grainAlpha = Math.random() * 0.5 + 0.1;

      this.ctx.fillStyle = `rgba(${rgb}, ${grainAlpha})`;
      this.ctx.fillRect(grainX, grainY, 1.5, 1.5);
    }
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
        roohDrawStyle: 'draw-chalk',
      } as any);
      this.canvas.add(img);
      this.editor.commit();
    });
  }
}
