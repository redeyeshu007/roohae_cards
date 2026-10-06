/**
 * FILE PURPOSE:
 * Non-destructive vector eraser and raster canvas clearing engine.
 *
 * MAIN RESPONSIBILITY:
 * Erases freehand drawings by splitting vector paths at the eraser radius using dense resampling,
 * and clears rasterized paint strokes directly from canvas bitmasks.
 *
 * CONNECTED SYSTEMS:
 * - packages/editor-sdk/src/tools/common/ToolManager.ts (manages eraser lifecycle)
 * - packages/ui/src/editor/ToolsPanel.tsx (Draw > Eraser tool)
 */

import { Path, Point, Image as FabricImage } from 'fabric';
import { BaseDrawTool } from './BaseDrawTool';
import { ToolContext } from '../common/BaseTool';
import { distance, smoothPathFromPoints } from './utils';

/**
 * Resamples an array of points so that adjacent points are spaced no further than maxDist apart.
 * This guarantees dense point coverage for smooth partial vector path erasing.
 */
function resamplePoints(points: Point[], maxDist = 4): Point[] {

  if (points.length < 2) return points;
  const dense: Point[] = [points[0]!];
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const d = distance(p1, p2);
    if (d > maxDist) {
      const steps = Math.ceil(d / maxDist);
      for (let s = 1; s <= steps; s++) {
        const t = s / steps;
        dense.push(new Point(p1.x + t * (p2.x - p1.x), p1.y + t * (p2.y - p1.y)));
      }
    } else {
      dense.push(p2);
    }
  }
  return dense;
}

export class EraserEngine extends BaseDrawTool {
  private isDrawing = false;
  private eraserCircle: Path | null = null;
  private radius = 20;

  constructor(context: ToolContext) {
    super('draw-eraser', context);
    this.config.thickness = 20;
  }

  protected override pointerDown(e: any): void {
    this.canvas.discardActiveObject();
    const pointer = e.scenePoint || this.canvas.getScenePoint(e.e);
    this.isDrawing = true;
    this.radius = Math.max(5, this.config.thickness);

    this.updateEraserCursor(pointer);
    this.eraseAtPoint(pointer);
  }

  protected override pointerMove(e: any): void {
    const pointer = e.scenePoint || this.canvas.getScenePoint(e.e);
    this.radius = Math.max(5, this.config.thickness);

    this.updateEraserCursor(pointer);

    if (!this.isDrawing) return;
    this.eraseAtPoint(pointer);
  }

  protected override pointerUp(e: any): void {
    if (this.isDrawing) {
      this.isDrawing = false;
      this.editor.commit();
    }
    this.removeEraserCursor();
  }

  protected override onDeactivate(): void {
    this.removeEraserCursor();
  }

  protected override onConfigChange(): void {
    this.radius = Math.max(5, this.config.thickness);
  }

  private updateEraserCursor(pointer: Point): void {
    if (!this.eraserCircle) {
      this.eraserCircle = new Path(this.createCirclePath(pointer.x, pointer.y, this.radius), {
        fill: 'rgba(239, 68, 68, 0.15)',
        stroke: '#EF4444',
        strokeWidth: 1.5,
        selectable: false,
        evented: false,
        hasControls: false,
        hasBorders: false,
      });
      this.canvas.add(this.eraserCircle);
    } else {
      this.eraserCircle.set({
        path: this.createCirclePath(pointer.x, pointer.y, this.radius) as any,
      });
    }
    this.canvas.requestRenderAll();
  }

  private removeEraserCursor(): void {
    if (this.eraserCircle) {
      this.canvas.remove(this.eraserCircle);
      this.eraserCircle = null;
      this.canvas.requestRenderAll();
    }
  }

  private eraseAtPoint(pointer: Point): void {
    const objects = this.canvas.getObjects();
    const eraserRadius = this.radius;
    let needsRender = false;

    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i] as any;

      if (obj === this.eraserCircle) continue;

      const isDrawAsset = obj.roohAssetType === 'draw' || obj.type === 'path' || !!obj.roohDrawStyle || obj.type === 'image';
      if (!isDrawAsset) continue;

      const bbox = obj.getBoundingRect ? obj.getBoundingRect() : {
        left: obj.left,
        top: obj.top,
        width: obj.width,
        height: obj.height,
      };

      const isNearBbox = !(
        pointer.x + eraserRadius < bbox.left ||
        pointer.x - eraserRadius > bbox.left + bbox.width ||
        pointer.y + eraserRadius < bbox.top ||
        pointer.y - eraserRadius > bbox.top + bbox.height
      );

      if (!isNearBbox) continue;

      if (obj instanceof Path) {
        const matrix = obj.calcTransformMatrix();
        const pathData = (obj.path as unknown as any[][]) || [];
        const pathOffsetX = obj.pathOffset ? obj.pathOffset.x : 0;
        const pathOffsetY = obj.pathOffset ? obj.pathOffset.y : 0;

        const rawPoints: Point[] = [];
        for (const cmd of pathData) {
          if (!cmd || cmd.length < 3) continue;
          const rawX = cmd[cmd.length - 2];
          const rawY = cmd[cmd.length - 1];
          if (typeof rawX !== 'number' || typeof rawY !== 'number') continue;
          const localPt = new Point(rawX - pathOffsetX, rawY - pathOffsetY);
          const transformed = localPt.transform(matrix);
          rawPoints.push(new Point(transformed.x, transformed.y));
        }

        if (rawPoints.length < 2) continue;

        // Dense resampling to ensure clean segment cutting
        const densePoints = resamplePoints(rawPoints, 4);

        const strokeWidthPad = (obj.strokeWidth || 4) / 2;
        const effectiveRadius = eraserRadius + strokeWidthPad;

        const isInside = densePoints.map(pt => distance(pt, pointer) <= effectiveRadius);
        const insideCount = isInside.filter(Boolean).length;

        if (insideCount === 0) continue;

        if (insideCount === densePoints.length) {
          // Entire path covered by eraser
          this.canvas.remove(obj);
          needsRender = true;
          continue;
        }

        // Subdivide path into remaining un-erased runs
        const subRuns: Point[][] = [];
        let currentRun: Point[] = [];

        for (let k = 0; k < densePoints.length; k++) {
          const pt = densePoints[k]!;
          const inside = isInside[k]!;

          if (!inside) {
            currentRun.push(pt);
          } else {
            if (currentRun.length > 0) {
              subRuns.push(currentRun);
              currentRun = [];
            }
          }
        }
        if (currentRun.length > 0) {
          subRuns.push(currentRun);
        }

        // Remove original path
        this.canvas.remove(obj);
        needsRender = true;

        // Re-create remaining sub-paths
        for (const run of subRuns) {
          if (run.length >= 2) {
            const newPathArray = smoothPathFromPoints(run);
            const newPath = new Path(newPathArray as any, {
              fill: '',
              stroke: obj.stroke,
              strokeWidth: obj.strokeWidth,
              strokeLineCap: obj.strokeLineCap || 'round',
              strokeLineJoin: obj.strokeLineJoin || 'round',
              opacity: obj.opacity ?? 1,
              selectable: false,
              evented: false,
              hasControls: false,
              hasBorders: false,
              roohAssetType: (obj as any).roohAssetType || 'draw',
              roohDrawStyle: (obj as any).roohDrawStyle || 'draw-pencil',
            } as any);
            this.canvas.add(newPath);
          }
        }
      } else if (obj.type === 'image' || obj instanceof FabricImage) {
        // Raster pixel erasing for Brush, Chalk, Spray images
        try {
          const scaleX = obj.scaleX || 1;
          const scaleY = obj.scaleY || 1;
          const localX = (pointer.x - obj.left) / scaleX;
          const localY = (pointer.y - obj.top) / scaleY;
          const localRadius = eraserRadius / Math.max(scaleX, scaleY);

          let element = obj._element;
          if (!element) continue;

          let canvas: HTMLCanvasElement;
          let ctx: CanvasRenderingContext2D;

          if (element instanceof HTMLCanvasElement) {
            canvas = element;
            ctx = canvas.getContext('2d')!;
          } else {
            canvas = document.createElement('canvas');
            canvas.width = obj.width || element.width || 300;
            canvas.height = obj.height || element.height || 300;
            ctx = canvas.getContext('2d')!;
            ctx.drawImage(element, 0, 0);
            obj._element = canvas;
          }

          ctx.globalCompositeOperation = 'destination-out';
          ctx.beginPath();
          ctx.arc(localX, localY, localRadius, 0, Math.PI * 2);
          ctx.fill();

          obj.setCoords();
          needsRender = true;
        } catch {
          // Fallback: remove image if pixel manipulation fails
          this.canvas.remove(obj);
          needsRender = true;
        }
      }
    }

    if (needsRender) {
      this.canvas.requestRenderAll();
    }
  }

  private createCirclePath(x: number, y: number, r: number): any[] {
    return [
      ['M', x, y - r],
      ['A', r, r, 0, 1, 1, x, y + r],
      ['A', r, r, 0, 1, 1, x, y - r],
    ];
  }
}
