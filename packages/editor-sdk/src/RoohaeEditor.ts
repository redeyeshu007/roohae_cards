/**
 * FILE PURPOSE:
 * Roohae Editor Facade (RoohaeEditor) wrapping the Fabric.js interactive canvas.
 *
 * MAIN RESPONSIBILITY:
 * Core SDK boundary wrapping the Fabric.js interactive canvas.
 * Encapsulates all object manipulation, history tracking, viewport scaling,
 * layer management, background matting, drawing engines, and serialization.
 * Ensures React components never manipulate raw Fabric canvas objects directly.
 *
 * CRITICAL ARCHITECTURAL RULES:
 * 1. Coordinates: Always work in native design document coordinates, not viewport pixel space.
 * 2. Locking: In User mode, locked objects (roohEditable: false) must remain non-interactive.
 * 3. Asset Resolution: Assets are referenced by assetId and resolved at runtime. Do not hardcode URLs.
 * 4. Image Transformations: In removeBackgroundFromSelected(), always preserve origin, scale, crop, and rotation.
 *
 * CONNECTED SYSTEMS:
 * - packages/ui/src/editor/EditorWorkspace.tsx
 * - apps/admin/src/app/editor/[templateId]/page.tsx
 * - apps/user/src/components/ProjectEditor.tsx
 */

import {
  ActiveSelection,
  Canvas,
  FabricImage,
  Group,
  Shadow,
  Textbox,
  FabricObject,
  filters
} from 'fabric';
import type { DesignDocument, DesignPage } from '@roohae/shared';
import { Emitter } from './emitter';
import { HistoryManager } from './HistoryManager';
import { BorderLayerManager } from './BorderLayerManager';
import { ToolManager } from './tools/common/ToolManager';
import { PencilEngine } from './tools/draw/PencilEngine';
import { DrawPenEngine } from './tools/draw/DrawPenEngine';
import { MarkerEngine } from './tools/draw/MarkerEngine';
import { HighlighterEngine } from './tools/draw/HighlighterEngine';
import { BrushEngine } from './tools/draw/BrushEngine';
import { ChalkEngine } from './tools/draw/ChalkEngine';
import { SprayEngine } from './tools/draw/SprayEngine';
import { EraserEngine } from './tools/draw/EraserEngine';
import { SignatureEngine } from './tools/signature/SignatureEngine';
import { ShapeFactory, ShapeOptions } from './tools/shapes/ShapeFactory';
import { StickyEngine, StickyOptions } from './tools/sticky/StickyEngine';
import { WordArtEngine, WordArtOptions } from './tools/wordart/WordArtEngine';
import { QRCodeEngine, QRCodeOptions } from './tools/qrcode/QRCodeEngine';
import { ObjectFactory } from './ObjectFactory';
import {
  newObjectId,
  pageToFabricJSON,
  toDesignObject,
} from './serialization';
import type {
  EditorEvents,
  EditorOptions,
  EditableField,
  ImagePlaceholder,
  ImageReplacementFit,
  LayerEntry,
  ObjectSnapshot,
  PageEntry,
  SelectionState,
  ShapeKind,
  TextPreset,
} from './types';

type Rooh = FabricObject & {
  id?: string;
  name?: string;
  /** Roohae "user may edit" flag (stored as `editable` in the document). */
  roohEditable?: boolean;
  locked?: boolean;
  hidden?: boolean;
  assetId?: string;
  uppercase?: boolean;
  rawText?: string;
  placeholderName?: string;
  allowedAssetIds?: string[];
  allowCustomUpload?: boolean;
  accept?: string[];
  maxSizeMB?: number;
  userReplaced?: boolean;
};

const ZOOM_MIN = 0.05;
const ZOOM_MAX = 4;

/**
 * The Editor SDK facade. React components interact ONLY with this class —
 * Fabric.js never leaks past this boundary.
 */
export class RoohaeEditor {
  private canvas: Canvas;
  private readonly emitter = new Emitter<EditorEvents>();
  private readonly factory = new ObjectFactory();
  private readonly history = new HistoryManager();
  public readonly toolManager: ToolManager;
  private readonly mode: EditorOptions['mode'];
  private readonly resolveAsset: EditorOptions['resolveAsset'];

  private doc: DesignDocument;
  private activePageIndex = 0;
  private zoom = 1;
  private loading = false;
  private disposed = false;
  private clipboard: FabricObject | null = null;

  constructor(canvasEl: HTMLCanvasElement, options: EditorOptions) {
    this.mode = options.mode;
    this.resolveAsset = options.resolveAsset;
    this.doc = structuredClone(options.document);

    this.canvas = new Canvas(canvasEl, {
      preserveObjectStacking: true,
      controlsAboveOverlay: true,
      selectionColor: 'rgba(139, 92, 246, 0.1)',
      selectionBorderColor: '#8B5CF6',
      selectionLineWidth: 1,
      stopContextMenu: false,
    });
    this.canvas.setDimensions({ width: this.doc.width, height: this.doc.height });
    this.toolManager = new ToolManager({ canvas: this.canvas, editor: this });
    this.toolManager.registerTool(new PencilEngine({ canvas: this.canvas, editor: this }));
    this.toolManager.registerTool(new DrawPenEngine({ canvas: this.canvas, editor: this }));
    this.toolManager.registerTool(new MarkerEngine({ canvas: this.canvas, editor: this }));
    this.toolManager.registerTool(new HighlighterEngine({ canvas: this.canvas, editor: this }));
    this.toolManager.registerTool(new BrushEngine({ canvas: this.canvas, editor: this }));
    this.toolManager.registerTool(new ChalkEngine({ canvas: this.canvas, editor: this }));
    this.toolManager.registerTool(new SprayEngine({ canvas: this.canvas, editor: this }));
    this.toolManager.registerTool(new EraserEngine({ canvas: this.canvas, editor: this }));
    this.toolManager.registerTool(new SignatureEngine({ canvas: this.canvas, editor: this }));
    this.bindCanvasEvents();
  }

  async init(): Promise<void> {
    await this.loadPage(0);
  }

  get isDisposed(): boolean {
    return this.disposed;
  }

  get document(): DesignDocument {
    return this.doc;
  }

  destroy(): void {
    void this.destroyAsync();
  }

  /**
   * Disposal is async in Fabric v6. Await this before creating another
   * editor on the same <canvas> element (React StrictMode remounts).
   */
  async destroyAsync(): Promise<void> {
    if (this.disposed) return;
    this.disposed = true;
    if (this.commitTimer) clearTimeout(this.commitTimer);
    this.emitter.removeAll();
    try {
      await this.canvas.dispose();
    } catch {
      // The canvas element may already be detached — nothing to clean up.
    }
  }

  on<K extends keyof EditorEvents>(event: K, cb: (payload: EditorEvents[K]) => void): () => void {
    return this.emitter.on(event, cb);
  }

  // ------------------------------------------------------------------ tools

  insertShape(type: 'rectangle' | 'circle' | 'triangle' | 'star' | 'ellipse' | 'rounded-rectangle', options?: ShapeOptions): void {
    let shape;
    switch (type) {
      case 'rectangle': shape = ShapeFactory.createRectangle(options); break;
      case 'rounded-rectangle': shape = ShapeFactory.createRoundedRectangle(options); break;
      case 'circle': shape = ShapeFactory.createCircle(options); break;
      case 'triangle': shape = ShapeFactory.createTriangle(options); break;
      case 'ellipse': shape = ShapeFactory.createEllipse(options); break;
      case 'star': shape = ShapeFactory.createStar(options); break;
      default: shape = ShapeFactory.createRectangle(options);
    }
    this.addAndCenter(shape);
  }

  addStickyNote(options?: StickyOptions): void {
    const sticky = StickyEngine.createStickyNote(options);
    this.addAndCenter(sticky);
  }

  addWordArt(options?: WordArtOptions): void {
    const wordArt = WordArtEngine.createWordArt(options);
    this.addAndCenter(wordArt);
  }

  addTextSignature(text: string, fontFamily: string, color: string): void {
    const textbox = new Textbox(text || 'Signature', {
      fontFamily,
      fontSize: 80,
      fill: color,
      textAlign: 'center',
      roohAssetType: 'signature',
      
      // Standard selection styling matching the rest of the project
      transparentCorners: false,
      cornerColor: '#FFFFFF',
      cornerStrokeColor: '#94A3B8',
      borderColor: '#8B5CF6',
      cornerSize: 12,
      cornerStyle: 'circle',
      borderScaleFactor: 2.5,
    } as any);

    this.addAndCenter(textbox);
  }

  async addQRCode(options?: QRCodeOptions): Promise<void> {
    const qr = await QRCodeEngine.createQRCode(options);
    this.addAndCenter(qr);
  }

  /**
   * Remove background from the currently selected image object.
   * Uses a pure client-side approach: samples border pixels to determine the
   * dominant background colour, then removes matching pixels with soft alpha
   * matting for clean edges.
   */
  async removeBackgroundFromSelected(tolerance = 30): Promise<void> {
    const active = this.canvas.getActiveObject();
    if (!active || !(active instanceof FabricImage)) {
      throw new Error('Please select an image layer first.');
    }

    const img = active as FabricImage & Rooh;
    const el = img.getElement() as HTMLImageElement | HTMLCanvasElement;

    // Render image to an offscreen canvas at natural resolution
    const offscreen = document.createElement('canvas');
    const natW = ('naturalWidth' in el ? el.naturalWidth : el.width) || img.width;
    const natH = ('naturalHeight' in el ? el.naturalHeight : el.height) || img.height;
    offscreen.width = natW;
    offscreen.height = natH;
    const ctx = offscreen.getContext('2d')!;
    ctx.drawImage(el, 0, 0, natW, natH);

    const imageData = ctx.getImageData(0, 0, natW, natH);
    const { data } = imageData;
    const w = natW;
    const h = natH;

    // --- Step 1: Sample border pixels to find dominant background colour ---
    const borderPixels: Array<[number, number, number]> = [];
    const samplePixel = (x: number, y: number) => {
      const idx = (y * w + x) * 4;
      if (data[idx + 3]! > 128) {
        borderPixels.push([data[idx]!, data[idx + 1]!, data[idx + 2]!]);
      }
    };
    // Top & bottom rows
    for (let x = 0; x < w; x++) { samplePixel(x, 0); samplePixel(x, h - 1); }
    // Left & right columns
    for (let y = 0; y < h; y++) { samplePixel(0, y); samplePixel(w - 1, y); }

    if (borderPixels.length === 0) {
      throw new Error('Could not detect background colour.');
    }

    // Average colour of border pixels
    let rSum = 0, gSum = 0, bSum = 0;
    for (const [r, g, b] of borderPixels) { rSum += r; gSum += g; bSum += b; }
    const n = borderPixels.length;
    const bgR = Math.round(rSum / n);
    const bgG = Math.round(gSum / n);
    const bgB = Math.round(bSum / n);

    // --- Step 2: Remove matching pixels with soft alpha ---
    const tol = tolerance;
    const softEdge = tol * 0.6; // transition zone for smooth edges

    for (let i = 0; i < data.length; i += 4) {
      const dr = data[i]! - bgR;
      const dg = data[i + 1]! - bgG;
      const db = data[i + 2]! - bgB;
      const dist = Math.sqrt(dr * dr + dg * dg + db * db);

      if (dist < tol - softEdge) {
        // Definitely background → fully transparent
        data[i + 3] = 0;
      } else if (dist < tol + softEdge) {
        // Transition zone → partial transparency for soft edges
        const alpha = Math.round(((dist - (tol - softEdge)) / (2 * softEdge)) * 255);
        data[i + 3] = Math.min(data[i + 3]!, alpha);
      }
      // else: keep original alpha
    }

    ctx.putImageData(imageData, 0, 0);

    // --- Step 3: Replace the image source on the Fabric object ---
    const resultDataUrl = offscreen.toDataURL('image/png');
    const newImg = await FabricImage.fromURL(resultDataUrl, { crossOrigin: 'anonymous' });

    // Preserve position, size, rotation, origin, and custom properties of the original image
    const origProps = {
      left: img.left,
      top: img.top,
      width: img.width,
      height: img.height,
      scaleX: img.scaleX,
      scaleY: img.scaleY,
      cropX: img.cropX,
      cropY: img.cropY,
      angle: img.angle,
      flipX: img.flipX,
      flipY: img.flipY,
      originX: img.originX,
      originY: img.originY,
      skewX: img.skewX,
      skewY: img.skewY,
      opacity: img.opacity,
    };

    // Copy all custom properties defined in CUSTOM_PROPS (excluding assetId so that the data-URL is saved and resolved directly)
    const customProps: Record<string, any> = {};
    for (const key of ['id', 'name', 'roohEditable', 'locked', 'hidden', 'placeholderName', 'allowedAssetIds', 'allowCustomUpload', 'accept', 'maxSizeMB', 'userReplaced', 'roohAssetType']) {
      if (key in img) {
        customProps[key] = (img as any)[key];
      }
    }

    newImg.set({
      ...origProps,
      ...customProps,
      assetId: undefined, // Clear assetId so it references the new background-removed data URL
      src: resultDataUrl,  // Save the background-removed base64 image data directly
      transparentCorners: false,
      cornerColor: '#FFFFFF',
      cornerStrokeColor: '#94A3B8',
      borderColor: '#8B5CF6',
      cornerSize: 12,
      cornerStyle: 'circle',
      borderScaleFactor: 2.5,
    } as any);

    // Remove old, add new
    this.canvas.remove(img);
    this.canvas.add(newImg);
    this.canvas.setActiveObject(newImg);
    this.commit();
  }

  private addAndCenter(obj: FabricObject): void {
    this.canvas.add(obj);
    this.canvas.centerObject(obj);
    this.canvas.setActiveObject(obj);
    this.commit();
  }

  // ------------------------------------------------------------------ events

  private bindCanvasEvents(): void {
    const commitEvents = ['object:modified', 'text:changed'] as const;
    for (const evt of commitEvents) {
      this.canvas.on(evt, () => {
        if (!this.loading) this.commit();
      });
    }
    this.canvas.on('object:added', () => {
      if (!this.loading) this.commit();
    });
    this.canvas.on('object:removed', () => {
      if (!this.loading) this.commit();
    });

    const emitSelection = () => this.emitter.emit('selection:change', this.getSelection());
    this.canvas.on('selection:created', emitSelection);
    this.canvas.on('selection:updated', emitSelection);
    this.canvas.on('selection:cleared', () => {
      emitSelection();
    });

    // Double-click to edit Sticky Note text on canvas is now handled natively by Fabric's Textbox
  }

  /** Sync canvas → document, push history, notify listeners. */
  public commit(): void {
    if (this.commitTimer) {
      clearTimeout(this.commitTimer);
      this.commitTimer = undefined;
    }
    this.syncActivePage();
    this.history.push(this.activePage());
    this.emitChange();
  }

  private commitTimer: ReturnType<typeof setTimeout> | undefined;

  /**
   * Debounced commit for high-frequency edits (typing, slider drags). The
   * canvas renders immediately; page serialization + history recording batch
   * into one commit, so undo captures the burst and typing stays smooth.
   */
  private commitSoon(delay = 250): void {
    if (this.commitTimer) clearTimeout(this.commitTimer);
    this.commitTimer = setTimeout(() => {
      this.commitTimer = undefined;
      if (!this.disposed) this.commit();
    }, delay);
  }

  private emitChange(): void {
    this.emitter.emit('document:change', undefined);
    this.emitter.emit('layers:change', this.getLayers());
    this.emitter.emit('history:change', {
      canUndo: this.history.canUndo,
      canRedo: this.history.canRedo,
    });
  }

  // -------------------------------------------------------------- pages

  private activePage(): DesignPage {
    return this.doc.pages[this.activePageIndex]!;
  }

  private syncActivePage(): void {
    const page = this.activePage();
    page.objects = this.canvas.getObjects().map((o) => toDesignObject(o));
    page.background = String(this.canvas.backgroundColor ?? '#ffffff');
  }

  private async loadPage(index: number): Promise<void> {
    if (this.disposed) return;
    this.loading = true;
    this.emitter.emit('loading:change', true);
    try {
      this.activePageIndex = index;
      const page = this.activePage();
      const json = pageToFabricJSON(page, this.resolveAsset);
      // Strip legacy border system objects and upgrade legacy Rect borders
      if (json && Array.isArray(json.objects)) {
        const objects = json.objects as any[];
        json.objects = objects.filter((o: any) => o.type !== 'RoohBorder');
        
        // Upgrade legacy fabric.Rect borders
        (json.objects as any[]).forEach((o: any) => {
          if ((o.type === 'rect' || o.type === 'Rect') && o.roohAssetType === 'border') {
            o.type = 'PageBorder';
            if (o.strokeWidth && !o.roohBorderThickness) {
              o.roohBorderThickness = o.strokeWidth;
              o.strokeWidth = 0;
            }
            
            // Migrate origin to center for perfect symmetric stroke growth
            if (o.originX === 'left' && o.originY === 'top') {
              o.originX = 'center';
              o.originY = 'center';
              if (o.width && o.height) {
                o.left = (o.left || 0) + o.width / 2;
                o.top = (o.top || 0) + o.height / 2;
              }
            }
          }
        });
      }
      await this.canvas.loadFromJSON(json);
      // The editor may have been destroyed while assets were loading
      // (StrictMode remount, route change) — bail before touching the canvas.
      if (this.disposed) return;
      for (const obj of this.canvas.getObjects()) {
        this.applyInteractivity(obj as Rooh);
      }
      await this.applyBackgroundToCanvas(page);
      this.canvas.requestRenderAll();
      this.history.reset(page);
    } catch (err) {
      if (this.disposed) return;
      throw err;
    } finally {
      this.loading = false;
      if (!this.disposed) this.emitter.emit('loading:change', false);
    }
    this.emitter.emit('pages:change', this.getPages());
    this.emitter.emit('selection:change', this.getSelection());
    this.emitChange();
  }

  /** Enforce lock/hide/editable rules on a live object. */
  private applyInteractivity(obj: Rooh): void {
    obj.visible = !obj.hidden;

    const userLocked = this.mode === 'user' && !obj.roohEditable;
    const isDrawStroke = (obj as any).roohAssetType === 'draw' || !!(obj as any).roohDrawStyle;
    if (userLocked || isDrawStroke) {
      // Non-editable or draw strokes: fully non-selectable
      obj.selectable = false;
      obj.evented = false;
      obj.hasControls = false;
      obj.hasBorders = false;
      obj.hoverCursor = 'default';
      return;
    }

    const locked = Boolean(obj.locked) || this.mode === 'user';
    obj.selectable = true;
    obj.evented = true;

    // Apply premium selection styling to all objects using obj.set() to ensure Fabric updates internal caches
    obj.set({
      transparentCorners: false,
      cornerColor: '#FFFFFF',
      cornerStrokeColor: '#94A3B8',
      borderColor: '#8B5CF6',
      cornerSize: 12,
      padding: 8,
      cornerStyle: 'circle',
      borderScaleFactor: 2.5,
    });

    obj.lockMovementX = locked;
    obj.lockMovementY = locked;
    obj.lockScalingX = locked;
    obj.lockScalingY = locked;
    obj.lockRotation = locked;
    obj.hasControls = !locked;
    if (obj instanceof Textbox) obj.editable = !(obj as Rooh).locked;

    if (obj.get('roohAssetType') === 'border') {
      obj.selectable = true;
      obj.evented = true;
      obj.hasControls = false;
      obj.hasBorders = true;
      obj.lockMovementX = true;
      obj.lockMovementY = true;
      obj.perPixelTargetFind = true;
    }
  }

  getPages(): PageEntry[] {
    return this.doc.pages.map((p, index) => ({
      id: p.id,
      name: p.name,
      index,
      active: index === this.activePageIndex,
    }));
  }

  async setActivePage(index: number): Promise<void> {
    if (index === this.activePageIndex || index < 0 || index >= this.doc.pages.length) return;
    this.syncActivePage();
    this.canvas.discardActiveObject();
    await this.loadPage(index);
  }

  private reindexPageNames() {
    for (let i = 0; i < this.doc.pages.length; i++) {
      const page = this.doc.pages[i];
      if (!page) continue;
      const pairNumber = Math.floor(i / 2) + 1;
      const side = i % 2 === 0 ? 'Front' : 'Back';
      page.name = `Page ${pairNumber} ${side}`;
    }
  }

  async addPage(): Promise<void> {
    if (this.mode === 'user') return;
    this.syncActivePage();
    this.doc.pages.push(
      {
        id: newObjectId(),
        name: '',
        background: '#ffffff',
        objects: [],
      },
      {
        id: newObjectId(),
        name: '',
        background: '#ffffff',
        objects: [],
      }
    );
    this.reindexPageNames();
    await this.loadPage(this.doc.pages.length - 2);
  }

  async duplicatePage(index: number): Promise<void> {
    if (this.mode === 'user') return;
    this.syncActivePage();
    const frontSource = this.doc.pages[index];
    const backSource = this.doc.pages[index + 1];
    if (!frontSource || !backSource) return;
    
    const frontCopy = structuredClone(frontSource);
    frontCopy.id = newObjectId();
    frontCopy.objects = frontCopy.objects.map((o) => ({ ...o, id: newObjectId() }));
    
    const backCopy = structuredClone(backSource);
    backCopy.id = newObjectId();
    backCopy.objects = backCopy.objects.map((o) => ({ ...o, id: newObjectId() }));
    
    this.doc.pages.splice(index + 2, 0, frontCopy, backCopy);
    this.reindexPageNames();
    await this.loadPage(index + 2);
  }

  async deletePage(index: number): Promise<void> {
    if (this.mode === 'user') return;
    if (this.doc.pages.length <= 2) return;
    this.doc.pages.splice(index, 2);
    this.reindexPageNames();
    await this.loadPage(Math.min(this.activePageIndex, this.doc.pages.length - 2));
  }

  async reorderPage(from: number, to: number): Promise<void> {
    if (this.mode === 'user') return;
    if (from === to || !this.doc.pages[from] || !this.doc.pages[from + 1] || to < 0 || to >= this.doc.pages.length) return;
    this.syncActivePage();
    const movedPair = this.doc.pages.splice(from, 2);
    this.doc.pages.splice(to, 0, ...movedPair);
    this.reindexPageNames();
    await this.loadPage(to);
  }

  renamePage(index: number, name: string): void {
    if (this.mode === 'user') return;
    const page = this.doc.pages[index];
    if (!page) return;
    page.name = name;
    this.emitter.emit('pages:change', this.getPages());
    this.emitter.emit('document:change', undefined);
  }

  setPageBackground(color: string): void {
    this.canvas.backgroundColor = color;
    this.canvas.requestRenderAll();
    this.commit();
  }

  getPageBackground(): string {
    return String(this.canvas.backgroundColor ?? '#ffffff');
  }

  async setPageBackgroundAsset(assetId: string, url: string): Promise<void> {
    const page = this.activePage();
    page.backgroundAssetId = assetId;
    page.backgroundImageSettings = page.backgroundImageSettings ?? {
      fit: 'fill',
      opacity: 100,
      blur: 0,
    };
    await this.applyBackgroundToCanvas(page);
    this.canvas.requestRenderAll();
    this.commit();
  }

  async setPageBackgroundImageSettings(
    settings: Partial<NonNullable<DesignPage['backgroundImageSettings']>>,
  ): Promise<void> {
    const page = this.activePage();
    if (!page.backgroundAssetId) return;
    page.backgroundImageSettings = {
      ...(page.backgroundImageSettings ?? { fit: 'fill', opacity: 100, blur: 0 }),
      ...settings,
    };
    await this.applyBackgroundToCanvas(page);
    this.canvas.requestRenderAll();
    this.commit();
  }

  async removePageBackgroundImage(): Promise<void> {
    const page = this.activePage();
    page.backgroundAssetId = undefined;
    page.backgroundImageSettings = undefined;
    await this.applyBackgroundToCanvas(page);
    this.canvas.requestRenderAll();
    this.commit();
  }

  private async applyBackgroundToCanvas(page: DesignPage): Promise<void> {
    this.canvas.backgroundColor = page.background;
    if (!page.backgroundAssetId) {
      this.canvas.backgroundImage = undefined;
      return;
    }
    const url = this.resolveAsset(page.backgroundAssetId);
    if (!url) {
      this.canvas.backgroundImage = undefined;
      return;
    }
    try {
      const img = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' });
      if (this.disposed) return;
      const settings = page.backgroundImageSettings ?? { fit: 'fill', opacity: 100, blur: 0 };
      
      img.set({ opacity: settings.opacity / 100 });
      
      if (settings.blur > 0) {
        img.filters.push(new filters.Blur({ blur: settings.blur / 20 }));
        img.applyFilters();
      }

      const canvasWidth = this.doc.width;
      const canvasHeight = this.doc.height;
      const imgWidth = img.width || 1;
      const imgHeight = img.height || 1;
      
      let scaleX = 1;
      let scaleY = 1;

      switch (settings.fit) {
        case 'fit': {
          const scale = Math.min(canvasWidth / imgWidth, canvasHeight / imgHeight);
          scaleX = scale;
          scaleY = scale;
          break;
        }
        case 'fill': {
          const scale = Math.max(canvasWidth / imgWidth, canvasHeight / imgHeight);
          scaleX = scale;
          scaleY = scale;
          break;
        }
        case 'stretch': {
          scaleX = canvasWidth / imgWidth;
          scaleY = canvasHeight / imgHeight;
          break;
        }
        case 'center':
        case 'tile': {
          break;
        }
      }
      
      img.set({ 
        scaleX, 
        scaleY, 
        originX: 'center', 
        originY: 'center', 
        left: canvasWidth / 2, 
        top: canvasHeight / 2,
        angle: settings.rotation ?? 0
      });
      this.canvas.backgroundImage = img;
    } catch (e) {
      console.error('Failed to load background image', e);
      this.canvas.backgroundImage = undefined;
    }
  }

  // -------------------------------------------------------------- objects

  private centerAndAdd(obj: FabricObject): void {
    obj.set({
      left: this.doc.width / 2,
      top: this.doc.height / 2,
      originX: 'center',
      originY: 'center',
    });
    this.canvas.add(obj);
    this.canvas.setActiveObject(obj);
    this.canvas.requestRenderAll();
  }

  addText(preset: TextPreset): void {
    if (this.mode === 'user') return;
    this.centerAndAdd(this.factory.createText(preset, this.doc.width));
  }

  addShape(kind: ShapeKind): void {
    if (this.mode === 'user') return;
    this.centerAndAdd(this.factory.createShape(kind, Math.round(this.doc.width / 3)));
  }

  private getAssetSourceUrl(assetId: string, url?: string): string | undefined {
    if (url) return url;
    if (!assetId) return undefined;
    const isUrl =
      assetId.startsWith('data:') ||
      assetId.startsWith('http://') ||
      assetId.startsWith('https://') ||
      assetId.startsWith('blob:') ||
      assetId.startsWith('/');
    if (isUrl) return assetId;
    return this.resolveAsset(assetId) ?? assetId;
  }

  async addImage(assetId: string, url?: string): Promise<void> {
    if (this.mode === 'user') return;
    const src = this.getAssetSourceUrl(assetId, url);
    if (!src) throw new Error(`Cannot resolve asset ${assetId}`);
    const image = await this.factory.createImage(src, assetId, Math.round(this.doc.width * 0.8));
    this.centerAndAdd(image);
  }

  async addSvgAsset(url: string, type: 'border' | 'line'): Promise<void> {
    if (this.mode === 'user') return;
    
    if (type === 'border') {
      const margin = 0;
      // Extract border style from URL or defaults
      let dashArray = null;
      if (url.includes('dashed')) dashArray = [18, 10];
      if (url.includes('dotted')) dashArray = [0, 14];
      
      const style = (dashArray && dashArray.length > 0 && dashArray[0] !== undefined) ? (dashArray[0] < 1 ? 'dotted' : 'dashed') : 'solid';

      const border = BorderLayerManager.createBorderLayer(
        this.doc.width,
        this.doc.height,
        {
          padding: margin,
          thickness: 2,
          strokeColor: '#1f2937',
          opacity: 1,
          style: style,
          dashArray: dashArray
        }
      );
      
      this.canvas.insertAt(0, border);
      this.canvas.setActiveObject(border);
      this.canvas.requestRenderAll();
    } else {
      const svgObj = await this.factory.createSvg(url, type, Math.round(this.doc.width * 0.8));
      svgObj.set('roohAssetType', type);
      this.centerAndAdd(svgObj);
    }
  }

  /**
   * Replace an editable image placeholder's content with a new asset,
   * preserving the placed frame (position, displayed size, angle, effects).
   * Only the live canvas / project document changes — templates are never
   * touched, and locked images are refused.
   */
  async replaceImage(
    objectId: string,
    assetId: string,
    url?: string,
    options: { fit?: ImageReplacementFit } = {},
  ): Promise<void> {
    const obj = this.findById(objectId);
    if (!obj || !(obj instanceof FabricImage)) throw new Error('Placeholder not found');
    const image = obj as FabricImage & Rooh;
    if (this.mode === 'user' && !image.roohEditable) {
      throw new Error('This image is locked and cannot be replaced');
    }

    const src = this.getAssetSourceUrl(assetId, url);
    if (!src) throw new Error(`Cannot resolve asset ${assetId}`);

    // Preserve the on-canvas frame across differing source resolutions.
    const displayedWidth = image.getScaledWidth();
    const displayedHeight = image.getScaledHeight();
    const center = image.getCenterPoint();

    await image.setSrc(src, { crossOrigin: 'anonymous' });
    if (this.disposed) return;

    const scaleX = displayedWidth / (image.width || 1);
    const scaleY = displayedHeight / (image.height || 1);
    const uniformScale = Math.min(scaleX, scaleY);
    const fit = options.fit ?? 'stretch';

    image.set({
      scaleX: fit === 'contain' ? uniformScale : scaleX,
      scaleY: fit === 'contain' ? uniformScale : scaleY,
      assetId,
      userReplaced: true,
    });
    if (fit === 'contain') image.setPositionByOrigin(center, 'center', 'center');
    image.setCoords();
    this.canvas.setActiveObject(image);
    this.canvas.requestRenderAll();
    this.commit();
    this.emitter.emit('selection:change', this.getSelection());
  }

  /**
   * Image objects on the active page, for the Images panel. In user mode
   * only admin-approved (editable) placeholders are returned — locked
   * images are invisible to end users by design.
   */
  getImagePlaceholders(): ImagePlaceholder[] {
    const selectedIds = new Set(this.getSelection().ids);
    return (this.canvas.getObjects() as Rooh[])
      .filter((o): o is FabricImage & Rooh => !o.hidden && o instanceof FabricImage)
      .filter((o) => this.mode === 'admin' || Boolean(o.roohEditable))
      .map((o) => ({
        id: o.id ?? '',
        label: o.placeholderName || o.name || 'Image',
        editable: Boolean(o.roohEditable),
        assetId: o.assetId,
        src: o.getSrc() || undefined,
        replaced: Boolean(o.userReplaced),
        selected: selectedIds.has(o.id ?? ''),
        accept: o.accept,
        maxSizeMB: o.maxSizeMB,
        allowedAssetIds: o.allowedAssetIds ?? [],
        // Undefined = true for documents authored before this feature.
        allowCustomUpload: o.allowCustomUpload !== false,
      }))
      .reverse();
  }

  getEditableFields(): EditableField[] {
    const selectedIds = new Set(this.getSelection().ids);
    return (this.canvas.getObjects() as Rooh[])
      .filter((o) => !o.hidden && Boolean(o.roohEditable) && !(o instanceof FabricImage))
      .map((o) => {
        const text = o instanceof Textbox ? o.text ?? '' : undefined;
        const label = o.placeholderName || o.name || (o instanceof Textbox ? 'Editable Text' : 'Editable Field');
        return {
          id: o.id ?? '',
          label,
          type: o.type ?? 'object',
          value: text,
          multiline:
            Boolean(text?.includes('\n')) ||
            /address|notes?|description|details/i.test(label),
          selected: selectedIds.has(o.id ?? ''),
        };
      })
      .reverse();
  }

  deleteSelection(): void {
    if (this.mode === 'user') return;
    const objects = this.canvas.getActiveObjects();
    if (!objects.length) return;
    this.canvas.discardActiveObject();
    for (const obj of objects) {
      if ((obj as Rooh).locked) continue;
      this.canvas.remove(obj);
    }
    this.canvas.requestRenderAll();
  }

  async duplicateSelection(): Promise<void> {
    if (this.mode === 'user') return;
    const active = this.canvas.getActiveObject();
    if (!active) return;
    const clone = (await active.clone()) as Rooh;
    this.canvas.discardActiveObject();
    clone.set({ left: (clone.left ?? 0) + 24, top: (clone.top ?? 0) + 24, id: newObjectId() });
    if (clone instanceof ActiveSelection) {
      for (const obj of clone.getObjects()) {
        (obj as Rooh).id = newObjectId();
        this.canvas.add(obj);
      }
      clone.setCoords();
    } else {
      this.canvas.add(clone);
      this.canvas.setActiveObject(clone);
    }
    this.canvas.requestRenderAll();
  }

  async copy(): Promise<void> {
    if (this.mode === 'user') return;
    const active = this.canvas.getActiveObject();
    if (active) this.clipboard = await active.clone();
  }

  async paste(): Promise<void> {
    if (this.mode === 'user') return;
    if (!this.clipboard) return;
    const clone = (await this.clipboard.clone()) as Rooh;
    clone.set({ left: (clone.left ?? 0) + 24, top: (clone.top ?? 0) + 24, id: newObjectId() });
    this.canvas.add(clone);
    this.canvas.setActiveObject(clone);
    this.canvas.requestRenderAll();
  }

  // ----------------------------------------------------- selection & props

  getSelection(): SelectionState {
    const objects = this.canvas.getActiveObjects() as Rooh[];
    return {
      ids: objects.map((o) => o.id ?? ''),
      count: objects.length,
      object: objects.length === 1 ? this.snapshot(objects[0]!) : undefined,
    };
  }

  private snapshot(obj: Rooh): ObjectSnapshot {
    const shadow = obj.shadow as Shadow | null | undefined;
    const text = obj instanceof Textbox ? obj : undefined;
    return {
      id: obj.id ?? '',
      type: obj.type ?? 'object',
      name: obj.name ?? 'Object',
      editable: Boolean(obj.roohEditable),
      locked: Boolean(obj.locked),
      hidden: Boolean(obj.hidden),
      assetId: obj.assetId,
      left: Math.round(obj.left ?? 0),
      top: Math.round(obj.top ?? 0),
      width: Math.round(obj.getScaledWidth()),
      height: Math.round(obj.getScaledHeight()),
      angle: Math.round(obj.angle ?? 0),
      opacity: obj.opacity ?? 1,
      fill: typeof obj.fill === 'string' ? obj.fill : undefined,
      stroke: typeof obj.stroke === 'string' ? obj.stroke : undefined,
      strokeWidth: (obj.get('roohAssetType') === 'border' || obj.type === 'PageBorder') ? obj.get('roohBorderThickness') : obj.strokeWidth,
      strokeDashArray: obj.strokeDashArray,
      rx: (obj as { rx?: number }).rx,
      backgroundColor: obj.backgroundColor,
      roohAssetType: obj.type === 'PageBorder' ? 'border' : obj.get('roohAssetType'),
      roohBorderPadding: obj.get('roohBorderPadding') ?? 0,
      text: text?.text,
      fontFamily: text?.fontFamily,
      fontSize: text?.fontSize,
      fontWeight: text?.fontWeight,
      fontStyle: text?.fontStyle,
      underline: text?.underline,
      textAlign: text?.textAlign,
      charSpacing: text?.charSpacing,
      lineHeight: text?.lineHeight,
      uppercase: Boolean(obj.uppercase),
      placeholderName: obj.placeholderName,
      allowedAssetIds: obj.allowedAssetIds,
      allowCustomUpload: obj.allowCustomUpload,
      shadow: shadow
        ? {
            color: String(shadow.color ?? '#000000'),
            blur: shadow.blur ?? 0,
            offsetX: shadow.offsetX ?? 0,
            offsetY: shadow.offsetY ?? 0,
          }
        : null,
    };
  }

  /**
   * Apply property changes to the current selection. This is the single
   * write-path used by the properties panel and top toolbar.
   */
  updateSelection(props: Partial<ObjectSnapshot>): void {
    const objects = this.canvas.getActiveObjects() as Rooh[];
    if (!objects.length) return;

    for (const obj of objects) {
      const { shadow, uppercase, text, width, height, editable, ...rest } = props;

      // Users may only change the CONTENT of editable text — styling,
      // transforms and permission fields are admin-only.
      if (this.mode === 'user') {
        if (obj.roohEditable && obj instanceof Textbox && text !== undefined) {
          obj.set({ text });
          obj.setCoords();
        }
        continue;
      }

      if (editable !== undefined) obj.roohEditable = editable;
      if (shadow !== undefined) {
        obj.shadow = shadow ? new Shadow({ ...shadow }) : null;
      }
      if (width !== undefined && obj.width) obj.set({ scaleX: width / obj.width });
      if (height !== undefined && obj.height) obj.set({ scaleY: height / obj.height });

      if (obj instanceof Textbox) {
        const tb = obj as Textbox & Rooh;
        if (uppercase !== undefined) {
          if (uppercase && !tb.uppercase) {
            tb.rawText = tb.text;
            tb.set({ text: tb.text.toUpperCase() });
          } else if (!uppercase && tb.uppercase) {
            tb.set({ text: tb.rawText ?? tb.text });
          }
          tb.uppercase = uppercase;
        }
        if (text !== undefined) tb.set({ text });
      }

      const clean = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined));
      
      const isBorder = obj.get('roohAssetType') === 'border' || obj.type === 'PageBorder';

      if (clean.roohBorderPadding !== undefined && isBorder) {
        BorderLayerManager.updateBorderPadding(obj as any, Number(clean.roohBorderPadding), this.doc.width, this.doc.height);
        delete clean.roohBorderPadding; // handeled
      }
      
      // Prevent strokeWidth from polluting PageBorder's native strokeWidth (which must be 0)
      let borderStrokeWidth: number | undefined;
      if (isBorder && clean.strokeWidth !== undefined) {
        borderStrokeWidth = clean.strokeWidth as number;
        delete clean.strokeWidth;
      }
      
      obj.set(clean);
      
      if (isBorder) {
        const border = obj as any;
        if (clean.stroke !== undefined) BorderLayerManager.updateBorderColor(border, clean.stroke as string);
        if (borderStrokeWidth !== undefined) BorderLayerManager.updateBorderThickness(border, borderStrokeWidth);
        if (clean.strokeDashArray !== undefined) {
           const dashArr = clean.strokeDashArray as number[];
           const style = (dashArr && dashArr.length > 0) ? (dashArr[0] !== undefined && dashArr[0] < 1 ? 'dotted' : 'dashed') : 'solid';
           BorderLayerManager.updateBorderStyle(border, style, dashArr);
        }
      } else if (obj.get('roohAssetType') && obj.isType('Group')) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (obj as any)._objects?.forEach((child: any) => {
          if (clean.stroke !== undefined) child.set({ stroke: clean.stroke });
          if (clean.fill !== undefined) child.set({ fill: clean.fill });
          if (clean.strokeWidth !== undefined) child.set({ strokeWidth: clean.strokeWidth });
          if (clean.strokeDashArray !== undefined) child.set({ strokeDashArray: clean.strokeDashArray });
        });
      }
      
      obj.setCoords();
    }

    // Canvas renders immediately; serialization/history batches (typing, sliders).
    this.canvas.requestRenderAll();
    this.commitSoon();
    this.emitter.emit('selection:change', this.getSelection());
  }

  updateObject(id: string, props: Partial<ObjectSnapshot>): void {
    const obj = this.findById(id);
    if (!obj) return;
    if (this.mode === 'user' && !obj.roohEditable) return;

    const { text, shadow, uppercase, width, height, editable, ...rest } = props;
    if (this.mode === 'admin' && editable !== undefined) obj.roohEditable = editable;
    if (this.mode === 'admin' && shadow !== undefined) {
      obj.shadow = shadow ? new Shadow({ ...shadow }) : null;
    }
    if (this.mode === 'admin' && width !== undefined && obj.width) obj.set({ scaleX: width / obj.width });
    if (this.mode === 'admin' && height !== undefined && obj.height) obj.set({ scaleY: height / obj.height });

    if (obj instanceof Textbox) {
      const tb = obj as Textbox & Rooh;
      if (uppercase !== undefined && this.mode === 'admin') {
        if (uppercase && !tb.uppercase) {
          tb.rawText = tb.text;
          tb.set({ text: tb.text.toUpperCase() });
        } else if (!uppercase && tb.uppercase) {
          tb.set({ text: tb.rawText ?? tb.text });
        }
        tb.uppercase = uppercase;
      }
      if (text !== undefined) tb.set({ text });
    }

    if (this.mode === 'admin') {
      const clean = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined));
      
      const isBorder = obj.get('roohAssetType') === 'border' || obj.type === 'PageBorder';

      if (clean.roohBorderPadding !== undefined && isBorder) {
        BorderLayerManager.updateBorderPadding(obj as any, Number(clean.roohBorderPadding), this.doc.width, this.doc.height);
        delete clean.roohBorderPadding; // handeled
      }
      
      // (isBorder variable moved up)
      
      // Prevent strokeWidth from polluting PageBorder's native strokeWidth (which must be 0)
      let borderStrokeWidth: number | undefined;
      if (isBorder && clean.strokeWidth !== undefined) {
        borderStrokeWidth = clean.strokeWidth as number;
        delete clean.strokeWidth;
      }
      
      obj.set(clean);
      
      if (isBorder) {
        const border = obj as any;
        if (clean.stroke !== undefined) BorderLayerManager.updateBorderColor(border, clean.stroke as string);
        if (borderStrokeWidth !== undefined) BorderLayerManager.updateBorderThickness(border, borderStrokeWidth);
        if (clean.strokeDashArray !== undefined) {
           const dashArr = clean.strokeDashArray as number[];
           const style = (dashArr && dashArr.length > 0) ? (dashArr[0] !== undefined && dashArr[0] < 1 ? 'dotted' : 'dashed') : 'solid';
           BorderLayerManager.updateBorderStyle(border, style, dashArr);
        }

      } else if (obj.get('roohAssetType') && obj.isType('Group')) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (obj as any)._objects?.forEach((child: any) => {
          if (clean.stroke !== undefined) child.set({ stroke: clean.stroke });
          if (clean.fill !== undefined) child.set({ fill: clean.fill });
          if (clean.strokeWidth !== undefined) child.set({ strokeWidth: clean.strokeWidth });
          if (clean.strokeDashArray !== undefined) child.set({ strokeDashArray: clean.strokeDashArray });
        });
      }
    }

    obj.setCoords();
    // Canvas renders immediately; serialization/history batches (typing).
    this.canvas.requestRenderAll();
    this.commitSoon();
    this.emitter.emit('selection:change', this.getSelection());
    this.emitter.emit('document:change', undefined);
  }

  selectObject(id: string): void {
    const obj = (this.canvas.getObjects() as Rooh[]).find((o) => o.id === id);
    if (!obj) return;
    
    // Borders are selectable directly now, just check if it's locked
    if (!obj.selectable) {
      return;
    }
    
    this.canvas.setActiveObject(obj);
    this.canvas.requestRenderAll();
    this.emitter.emit('selection:change', this.getSelection());
  }

  clearSelection(): void {
    this.canvas.discardActiveObject();
    this.canvas.requestRenderAll();
    this.emitter.emit('selection:change', this.getSelection());
  }

  // -------------------------------------------------------------- layers

  /** Top-most object first, mirroring Canva's Layers panel. */
  getLayers(): LayerEntry[] {
    const selectedIds = new Set(this.getSelection().ids);
    return (this.canvas.getObjects() as Rooh[])
      .map((o, index) => {
        if (!o.id) {
          o.id = `obj-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`;
        }
        return {
          id: o.id,
          name: o.name ?? ((o as any).roohAssetType === 'draw' ? 'Draw Stroke' : 'Object'),
          type: o.type ?? 'object',
          editable: Boolean(o.roohEditable),
          locked: Boolean(o.locked),
          hidden: Boolean(o.hidden),
          selected: selectedIds.has(o.id),
        };
      })
      .reverse();
  }

  private findById(id: string): Rooh | undefined {
    return (this.canvas.getObjects() as Rooh[]).find((o) => o.id === id);
  }

  private mutateObject(id: string, fn: (obj: Rooh) => void): void {
    const obj = this.findById(id);
    if (!obj) return;
    fn(obj);
    this.applyInteractivity(obj);
    this.canvas.requestRenderAll();
    this.commit();
    this.emitter.emit('selection:change', this.getSelection());
  }

  toggleLock(id: string): void {
    this.mutateObject(id, (o) => {
      o.locked = !o.locked;
    });
  }

  toggleHidden(id: string): void {
    this.mutateObject(id, (o) => {
      o.hidden = !o.hidden;
    });
  }

  renameObject(id: string, name: string): void {
    this.mutateObject(id, (o) => {
      o.name = name;
    });
  }

  /** Admin-only: mark whether end users may edit this object. */
  setObjectEditable(id: string, editable: boolean): void {
    this.mutateObject(id, (o) => {
      o.roohEditable = editable;
    });
  }



  group(): void {
    if (this.mode === 'user') return;
    const active = this.canvas.getActiveObject();
    if (!(active instanceof ActiveSelection)) return;
    const objects = active.removeAll();
    this.canvas.discardActiveObject();
    for (const obj of objects) this.canvas.remove(obj);
    const group = new Group(objects) as Rooh;
    group.id = newObjectId();
    group.name = 'Group';
    group.roohEditable = objects.every((o) => (o as Rooh).roohEditable);
    this.canvas.add(group);
    this.canvas.setActiveObject(group);
    this.canvas.requestRenderAll();
  }

  ungroup(): void {
    if (this.mode === 'user') return;
    const active = this.canvas.getActiveObject();
    if (!(active instanceof Group) || active instanceof ActiveSelection) return;
    const objects = active.removeAll() as Rooh[];
    this.canvas.remove(active);
    for (const obj of objects) {
      obj.id ||= newObjectId();
      this.canvas.add(obj);
    }
    const selection = new ActiveSelection(objects, { canvas: this.canvas });
    this.canvas.setActiveObject(selection);
    this.canvas.requestRenderAll();
  }

  align(position: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom'): void {
    if (this.mode === 'user') return;
    const obj = this.canvas.getActiveObject();
    if (!obj) return;
    const bounds = obj.getBoundingRect();
    const dx = (obj.left ?? 0) - bounds.left;
    const dy = (obj.top ?? 0) - bounds.top;
    switch (position) {
      case 'left':
        obj.set({ left: dx });
        break;
      case 'center-h':
        obj.set({ left: (this.doc.width - bounds.width) / 2 + dx });
        break;
      case 'right':
        obj.set({ left: this.doc.width - bounds.width + dx });
        break;
      case 'top':
        obj.set({ top: dy });
        break;
      case 'center-v':
        obj.set({ top: (this.doc.height - bounds.height) / 2 + dy });
        break;
      case 'bottom':
        obj.set({ top: this.doc.height - bounds.height + dy });
        break;
    }
    obj.setCoords();
    this.canvas.requestRenderAll();
    this.commit();
  }

  // -------------------------------------------------------------- zoom

  getZoom(): number {
    return this.zoom;
  }

  setZoom(zoom: number): void {
    this.zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom));
    this.canvas.setDimensions({
      width: this.doc.width * this.zoom,
      height: this.doc.height * this.zoom,
    });
    this.canvas.setZoom(this.zoom);
    this.canvas.requestRenderAll();
    this.emitter.emit('zoom:change', this.zoom);
  }

  zoomIn(): void {
    this.setZoom(this.zoom * 1.2);
  }

  zoomOut(): void {
    this.setZoom(this.zoom / 1.2);
  }

  zoomToFit(containerWidth: number, containerHeight: number, padding = 64): void {
    const scale = Math.min(
      (containerWidth - padding) / this.doc.width,
      (containerHeight - padding) / this.doc.height,
    );
    this.setZoom(scale);
  }

  // -------------------------------------------------------------- history

  async undo(): Promise<void> {
    this.syncActivePage();
    const snapshot = this.history.undo(this.activePage());
    if (snapshot) await this.restoreSnapshot(snapshot);
  }

  async redo(): Promise<void> {
    const snapshot = this.history.redo();
    if (snapshot) await this.restoreSnapshot(snapshot);
  }

  private async restoreSnapshot(page: DesignPage): Promise<void> {
    if (this.disposed) return;
    this.loading = true;
    try {
      this.doc.pages[this.activePageIndex] = page;
      const json = pageToFabricJSON(page, this.resolveAsset);
      await this.canvas.loadFromJSON(json);
      if (this.disposed) return;
      for (const obj of this.canvas.getObjects()) this.applyInteractivity(obj as Rooh);
      await this.applyBackgroundToCanvas(page);
      this.canvas.requestRenderAll();
    } catch (err) {
      if (this.disposed) return;
      throw err;
    } finally {
      this.loading = false;
    }
    this.emitChange();
    this.emitter.emit('selection:change', this.getSelection());
  }

  // -------------------------------------------------------------- output

  /** Full document snapshot for persistence (autosave / save template). */
  getDocument(): DesignDocument {
    this.syncActivePage();
    return structuredClone(this.doc);
  }

  /** Small JPEG of the active page for template/project thumbnails. */
  getThumbnail(maxWidth = 640): string {
    this.canvas.discardActiveObject();
    this.canvas.requestRenderAll();
    const multiplier = maxWidth / (this.doc.width * this.zoom);
    return this.canvas.toDataURL({ format: 'jpeg', quality: 0.8, multiplier });
  }

  getDimensions(): { width: number; height: number } {
    return { width: this.doc.width, height: this.doc.height };
  }

  setDocumentSize(width: number, height: number): void {
    this.doc.width = width;
    this.doc.height = height;
    
    this.canvas.setDimensions({
      width: width * this.zoom,
      height: height * this.zoom,
    });
    
    this.canvas.getObjects().forEach((obj) => {
      if (obj.get('roohAssetType') === 'border') {
        const margin = obj.get('roohBorderPadding') ?? 0;
        const scaleX = (width - margin * 2) / (obj.width || 1);
        const scaleY = (height - margin * 2) / (obj.height || 1);
        obj.set({
          left: width / 2,
          top: height / 2,
          scaleX,
          scaleY
        });
        obj.setCoords();
      }
    });
    
    this.canvas.requestRenderAll();
    this.commit();
  }
  // -------------------------------------------------------------- context menu operations

  bringToFront(): void {
    if (this.mode === 'user') return;
    const active = this.canvas.getActiveObjects();
    for (const obj of active) {
      if (obj.get('roohAssetType') === 'border') continue;
      this.canvas.bringObjectToFront(obj);
    }
    this.canvas.requestRenderAll();
    this.commit();
  }

  bringForward(): void {
    if (this.mode === 'user') return;
    const active = this.canvas.getActiveObjects();
    for (const obj of active) {
      if (obj.get('roohAssetType') === 'border') continue;
      this.canvas.bringObjectForward(obj);
    }
    this.canvas.requestRenderAll();
    this.commit();
  }

  sendBackward(): void {
    if (this.mode === 'user') return;
    const active = this.canvas.getActiveObjects();
    const borderCount = this.canvas.getObjects().filter((o) => o.get('roohAssetType') === 'border').length;
    for (const obj of active) {
      const idx = this.canvas.getObjects().indexOf(obj);
      if (idx > borderCount) {
        this.canvas.sendObjectBackwards(obj);
      }
    }
    this.canvas.requestRenderAll();
    this.commit();
  }

  sendToBack(): void {
    if (this.mode === 'user') return;
    const active = this.canvas.getActiveObjects();
    const borderCount = this.canvas.getObjects().filter((o) => o.get('roohAssetType') === 'border').length;
    for (const obj of active) {
      if (obj.get('roohAssetType') === 'border') {
        this.canvas.sendObjectToBack(obj);
      } else {
        this.canvas.moveObjectTo(obj, borderCount);
      }
    }
    this.canvas.requestRenderAll();
    this.commit();
  }

  flipHorizontal(): void {
    if (this.mode === 'user') return;
    const active = this.canvas.getActiveObjects();
    for (const obj of active) {
      obj.set('flipX', !obj.flipX);
    }
    this.canvas.requestRenderAll();
    this.commit();
  }

  flipVertical(): void {
    if (this.mode === 'user') return;
    const active = this.canvas.getActiveObjects();
    for (const obj of active) {
      obj.set('flipY', !obj.flipY);
    }
    this.canvas.requestRenderAll();
    this.commit();
  }

  rotateSelection(angle: number): void {
    if (this.mode === 'user') return;
    const active = this.canvas.getActiveObjects();
    for (const obj of active) {
      obj.set('angle', (obj.angle || 0) + angle);
    }
    this.canvas.requestRenderAll();
    this.commit();
  }

  resetRotation(): void {
    if (this.mode === 'user') return;
    const active = this.canvas.getActiveObjects();
    for (const obj of active) {
      obj.set('angle', 0);
    }
    this.canvas.requestRenderAll();
    this.commit();
  }

  lock(): void {
    if (this.mode === 'user') return;
    const active = this.canvas.getActiveObjects();
    for (const obj of active) {
      (obj as Rooh).locked = true;
      this.applyInteractivity(obj as Rooh);
    }
    this.canvas.discardActiveObject();
    this.canvas.requestRenderAll();
    this.commit();
  }

  unlock(): void {
    if (this.mode === 'user') return;
    const active = this.canvas.getActiveObjects();
    for (const obj of active) {
      (obj as Rooh).locked = false;
      this.applyInteractivity(obj as Rooh);
    }
    this.canvas.requestRenderAll();
    this.commit();
  }

  centerOnPage(): void {
    if (this.mode === 'user') return;
    const active = this.canvas.getActiveObject();
    if (!active) return;
    active.set({
      left: this.doc.width / 2,
      top: this.doc.height / 2,
      originX: 'center',
      originY: 'center',
    });
    active.setCoords();
    this.canvas.requestRenderAll();
    this.commit();
  }
}
