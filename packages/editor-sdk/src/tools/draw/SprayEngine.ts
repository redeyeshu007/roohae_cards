import { Image as FabricImage, Point } from 'fabric';
import { BaseDrawTool } from './BaseDrawTool';
import { ToolContext } from '../common/BaseTool';

export class SprayEngine extends BaseDrawTool {
  private isDrawing = false;
  private offscreenCanvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private lastPoint: Point | null = null;
  private minX = 0;
  private minY = 0;
  private maxX = 0;
  private maxY = 0;
  private previewImage: FabricImage | null = null;
  private animationFrameId: number | null = null;

  constructor(context: ToolContext) {
    super('draw-spray', context);
    this.config.thickness = 18;
    this.config.density = 25;
    this.config.scatter = 1.0;
    this.config.particleSize = 2;
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

    this.startSprayLoop();
  }

  protected override pointerMove(e: any): void {
    if (!this.isDrawing) return;
    const pointer = e.scenePoint || this.canvas.getScenePoint(e.e);
    this.lastPoint = new Point(pointer.x, pointer.y);
  }

  protected override pointerUp(e: any): void {
    if (this.isDrawing) {
      this.isDrawing = false;
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
      this.finalizeStroke();
    }
  }

  private startSprayLoop(): void {
    const loop = () => {
      if (!this.isDrawing || !this.lastPoint) return;

      this.drawSprayParticles(this.lastPoint);
      this.canvas.requestRenderAll();

      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  private drawSprayParticles(p: Point): void {
    const radius = this.config.thickness;
    const density = this.config.density || 25;
    const scatter = this.config.scatter || 1.0;
    const pSize = this.config.particleSize || 2;

    const maxRadius = radius * scatter;
    this.minX = Math.min(this.minX, p.x - maxRadius);
    this.minY = Math.min(this.minY, p.y - maxRadius);
    this.maxX = Math.max(this.maxX, p.x + maxRadius);
    this.maxY = Math.max(this.maxY, p.y + maxRadius);

    const rgb = this.hexToRgb(this.config.color);

    for (let i = 0; i < density; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.pow(Math.random(), 0.5) * maxRadius;

      const px = p.x + Math.cos(angle) * r;
      const py = p.y + Math.sin(angle) * r;

      const alpha = Math.random() * 0.8 + 0.2;
      const pRadius = Math.random() * pSize;

      this.ctx.fillStyle = `rgba(${rgb}, ${alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(px, py, Math.max(0.5, pRadius), 0, Math.PI * 2);
      this.ctx.fill();
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

    const pad = this.config.thickness * (this.config.scatter || 1);
    const minX = Math.max(0, this.minX - pad);
    const minY = Math.max(0, this.minY - pad);
    const maxX = Math.min(this.editor.document.width, this.maxX + pad);
    const maxY = Math.min(this.editor.document.height, this.maxY + pad);

    const w = maxX - minX;
    const h = maxY - minY;

    if (w <= 0 || h <= 0) return;

    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = w;
    cropCanvas.height = h;
    const cropCtx = cropCanvas.getContext('2d')!;
    cropCtx.drawImage(this.offscreenCanvas, minX, minY, w, h, 0, 0, w, h);

    FabricImage.fromURL(cropCanvas.toDataURL()).then(img => {
      img.set({
        left: minX,
        top: minY,
        opacity: this.config.opacity,
        selectable: false,
        evented: false,
        hasControls: false,
        hasBorders: false,
        roohAssetType: 'draw',
        roohDrawStyle: 'draw-spray',
      } as any);
      this.canvas.add(img);
      this.editor.commit();
    });
  }
}
