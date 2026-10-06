/**
 * FILE PURPOSE:
 * Foundation engine for all freehand brush tools in the Roohae Draw Engine.
 *
 * MAIN RESPONSIBILITY:
 * Manages pointer tracking, requestAnimationFrame throttling, simulated or hardware stylus pressure,
 * dynamic Bézier curve reconstruction, canvas rendering, and post-stroke object finalization.
 *
 * CONNECTED SYSTEMS:
 * - packages/editor-sdk/src/tools/draw/* (PencilEngine, DrawPenEngine, MarkerEngine, HighlighterEngine, BrushEngine, ChalkEngine, SprayEngine)
 * - packages/editor-sdk/src/RoohaeEditor.ts (integrates drawing objects into document history)
 */

import { Path, Point } from 'fabric';
import { BaseDrawTool } from './BaseDrawTool';
import { ToolContext } from '../common/BaseTool';
import { smoothPathFromPoints } from './utils';

// ABSTRACT DRAW ENGINE:
// Core interactive loop handling mousedown/mousemove/mouseup for artistic stroke generation.
export abstract class BaseDrawEngine extends BaseDrawTool {

  // Common state
  protected isDrawing = false;
  protected points: Point[] = [];
  protected activePath: Path | null = null;
  private pendingRender = false;
  private lastTimestamp = 0;
  private lastPointer: Point | null = null;

  constructor(id: string, context: ToolContext) {
    super(id, context);
  }

  /**
   * Sub‑classes can override to customize the initial Fabric Path options.
   */
  protected getInitialPathOptions(): any {
    return {
      fill: '',
      stroke: this.config.color,
      strokeWidth: this.config.thickness,
      strokeLineCap: 'round',
      strokeLineJoin: 'round',
      selectable: false,
      evented: false,
      hasControls: false,
      hasBorders: false,
      opacity: this.config.opacity ?? 1,
    };
  }

  /**
   * Sub‑classes may override to apply extra style (e.g. blur for highlighter).
   */
  protected applyStrokeStyle(path: Path, pressure: number = 1): void {
    const width = Math.max(1, this.config.thickness * pressure);
    path.set({ strokeWidth: width, stroke: this.config.color, opacity: this.config.opacity });
  }

  /**
   * Compute pressure – use native pressure if available, otherwise fall back to speed‑based
   * approximation (slower movement → higher pressure).
   */
  protected computePressure(e: any, current: Point): number {
    if (e && e.e && typeof e.e.pressure === 'number') {
      return Math.max(0.1, Math.min(1, e.e.pressure));
    }
    if (this.lastPointer && this.lastTimestamp) {
      const now = Date.now();
      const dt = now - this.lastTimestamp;
      const dist = Math.hypot(current.x - this.lastPointer.x, current.y - this.lastPointer.y);
      const speed = dt > 0 ? dist / dt : 0;
      const maxSpeed = 0.6; // tweakable
      const pressure = 1 - Math.min(speed / maxSpeed, 0.8);
      return Math.max(0.2, pressure);
    }
    return 1;
  }

  // ---------- BaseDrawTool overrides ----------
  protected override pointerDown(e: any): void {
    this.canvas.discardActiveObject();
    const pointer = e.scenePoint || this.canvas.getScenePoint(e.e);
    this.isDrawing = true;
    const pt = new Point(pointer.x, pointer.y);
    this.points = [pt];
    this.lastTimestamp = Date.now();
    this.lastPointer = pt;

    const pathOpts = this.getInitialPathOptions();
    // Initialize initial path with a tiny 0.1px line at current cursor location
    const initialPathArray = [['M', pt.x, pt.y], ['L', pt.x + 0.1, pt.y + 0.1]];
    this.activePath = new Path(initialPathArray as any, pathOpts);
    this.canvas.add(this.activePath);
    this.canvas.requestRenderAll();
  }

  protected override pointerMove(e: any): void {
    if (!this.isDrawing || !this.activePath) return;
    const pointer = e.scenePoint || this.canvas.getScenePoint(e.e);
    const pt = new Point(pointer.x, pointer.y);
    this.points.push(pt);
    const pressure = this.computePressure(e, pt);
    this.lastTimestamp = Date.now();
    this.lastPointer = pt;

    if (!this.pendingRender) {
      this.pendingRender = true;
      requestAnimationFrame(() => {
        this.pendingRender = false;
        if (!this.isDrawing || !this.activePath || !this.canvas) return;
        try {
          if (this.points.length < 2) return;
          const pathArray = smoothPathFromPoints(this.points);
          const pathOpts = this.getInitialPathOptions();

          // Re-instantiate Path to recalculate left, top, pathOffset accurately from pathArray
          this.canvas.remove(this.activePath);
          this.activePath = new Path(pathArray as any, pathOpts);
          this.applyStrokeStyle(this.activePath, pressure);
          this.canvas.add(this.activePath);
          this.canvas.requestRenderAll();
        } catch {
          // Ignore render errors
        }
      });
    }
  }

  protected override pointerUp(e: any): void {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    const path = this.activePath;
    this.activePath = null;
    this.points = [];

    if (path) {
      try {
        path.set({
          selectable: false,
          evented: false,
          hasControls: false,
          hasBorders: false,
        });
        path.setCoords();
        this.formatPath(path);
        this.canvas.discardActiveObject();
        this.editor.commit();
      } catch {
        // Ignore errors during finalization
      }
    }
  }
}
