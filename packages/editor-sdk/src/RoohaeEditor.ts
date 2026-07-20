import {
  ActiveSelection,
  Canvas,
  FabricImage,
  Group,
  Shadow,
  Textbox,
  FabricObject,
} from 'fabric';
import type { DesignDocument, DesignPage } from '@roohae/shared';
import { Emitter } from './emitter';
import { HistoryManager } from './HistoryManager';
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
      stopContextMenu: true,
    });
    this.canvas.setDimensions({ width: this.doc.width, height: this.doc.height });
    this.bindCanvasEvents();
  }

  async init(): Promise<void> {
    await this.loadPage(0);
  }

  get isDisposed(): boolean {
    return this.disposed;
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
    this.canvas.on('selection:cleared', emitSelection);
  }

  /** Sync canvas → document, push history, notify listeners. */
  private commit(): void {
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
      await this.canvas.loadFromJSON(json);
      // The editor may have been destroyed while assets were loading
      // (StrictMode remount, route change) — bail before touching the canvas.
      if (this.disposed) return;
      for (const obj of this.canvas.getObjects()) {
        this.applyInteractivity(obj as Rooh);
      }
      this.canvas.backgroundColor = page.background;
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
    if (userLocked) {
      // Admin marked this object non-editable: fully inert for end users.
      obj.selectable = false;
      obj.evented = false;
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
    if (this.mode === 'user') return;
    this.canvas.backgroundColor = color;
    this.canvas.requestRenderAll();
    this.commit();
  }

  getPageBackground(): string {
    return String(this.canvas.backgroundColor ?? '#ffffff');
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

  async addImage(assetId: string, url?: string): Promise<void> {
    if (this.mode === 'user') return;
    const src = url ?? this.resolveAsset(assetId);
    if (!src) throw new Error(`Cannot resolve asset ${assetId}`);
    const image = await this.factory.createImage(src, assetId, Math.round(this.doc.width * 0.8));
    this.centerAndAdd(image);
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

    const src = url ?? this.resolveAsset(assetId);
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
      strokeWidth: obj.strokeWidth,
      rx: (obj as { rx?: number }).rx,
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
      obj.set(clean);
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
      obj.set(clean);
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
    if (!obj || !obj.selectable) return;
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
      .map((o) => ({
        id: o.id ?? '',
        name: o.name ?? 'Object',
        type: o.type ?? 'object',
        editable: Boolean(o.roohEditable),
        locked: Boolean(o.locked),
        hidden: Boolean(o.hidden),
        selected: selectedIds.has(o.id ?? ''),
      }))
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

  bringForward(): void {
    if (this.mode === 'user') return;
    const obj = this.canvas.getActiveObject();
    if (!obj) return;
    this.canvas.bringObjectForward(obj);
    this.commit();
  }

  sendBackward(): void {
    if (this.mode === 'user') return;
    const obj = this.canvas.getActiveObject();
    if (!obj) return;
    this.canvas.sendObjectBackwards(obj);
    this.commit();
  }

  bringToFront(): void {
    if (this.mode === 'user') return;
    const obj = this.canvas.getActiveObject();
    if (!obj) return;
    this.canvas.bringObjectToFront(obj);
    this.commit();
  }

  sendToBack(): void {
    if (this.mode === 'user') return;
    const obj = this.canvas.getActiveObject();
    if (!obj) return;
    this.canvas.sendObjectToBack(obj);
    this.commit();
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
      this.canvas.backgroundColor = page.background;
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
}
