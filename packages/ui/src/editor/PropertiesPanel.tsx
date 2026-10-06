'use client';

/**
 * FILE PURPOSE:
 * Context-sensitive properties inspector and formatting sidebar.
 *
 * MAIN RESPONSIBILITY:
 * Dynamically renders formatting controls based on selected object type: typography, colors,
 * border styling, AI background removal, alignment, layer ordering, and placeholder rules.
 *
 * CONNECTED SYSTEMS:
 * - packages/ui/src/editor/EditorWorkspace.tsx (mounts PropertiesPanel in right sidebar)
 * - packages/editor-sdk (RoohaeEditor selection updates and object mutations)
 */

import {

  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  CaseUpper,
  Copy,
  Italic,
  Trash2,
  Underline,
  Scissors,
} from 'lucide-react';
import { useState } from 'react';
import type { Font } from '@roohae/shared';
import type { ObjectSnapshot, RoohaeEditor, SelectionState } from '@roohae/editor-sdk';
import { cn } from '../lib/cn';
import { Button, Badge, Input, Label, Separator } from '../components/basics';
import { Dialog, DialogContent } from '../components/overlays';
import type { AssetBrowserProps } from './LeftSidebar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Switch,
} from '../components/controls';
import { Tip } from '../components/overlays';
import { ColorField } from './ColorField';

const FONT_FALLBACKS = ['Inter, Arial, sans-serif', 'Arial', 'Georgia', 'Times New Roman', 'Courier New'];

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <label className="flex items-center gap-1.5">
      <span className="text-[10px] font-secondary tracking-[0.1em] uppercase text-[#8CA3B0] font-medium">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-8 w-full rounded-lg border border-[#E7DDD6] bg-white/60 px-1 text-center text-[13px] font-medium text-[#1F1F1F] transition-all hover:bg-white focus:border-[#C5A572] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C5A572]/20 shadow-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
    </label>
  );
}

function ToggleButton({
  active,
  onClick,
  children,
  label,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <Tip label={label}>
      <button
        onClick={onClick}
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-200',
          active
            ? 'border-[#C5A572] bg-[#F8F4EF] text-[#1F1F1F] shadow-sm ring-1 ring-[#C5A572]/30'
            : 'border-[#E7DDD6] bg-white/60 text-[#6B6B6B] hover:border-[#D0C2AE] hover:bg-white hover:text-[#1F1F1F] hover:shadow-sm',
        )}
      >
        {children}
      </button>
    </Tip>
  );
}

/**
 * Roohae Editor PropertiesPanel Component
 *
 * PURPOSE:
 * Context-sensitive properties inspector and formatting sidebar.
 * Adapts in real-time to the active selection (Text, Image, Shape, Draw, Border, Sticky Note).
 * Provides typography formatting, color fills, border adjustments, layer ordering,
 * alignment, object locking, and background matting removal.
 *
 * USED BY:
 * - packages/ui/src/editor/EditorWorkspace.tsx
 *
 * CALLS:
 * - editor.updateSelection()
 * - editor.removeBackgroundFromSelected()
 * - editor.duplicateSelection()
 * - editor.deleteSelection()
 * - editor.bringForward() / editor.sendBackward()
 *
 * DEPENDENCIES:
 * - @roohae/editor-sdk (RoohaeEditor)
 * - @roohae/shared (Font types)
 * - Radix UI primitives & Lucide icons
 */

export function PropertiesPanel({
  editor,
  selection,
  fonts,
  isAdmin,
  assetBrowser,
}: {
  editor: RoohaeEditor | null;
  selection: SelectionState;
  fonts: Font[];
  isAdmin: boolean;
  /** Library browser used by the allowed-replacements gallery picker. */
  assetBrowser?: AssetBrowserProps;
}) {
  const obj = selection.object;
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [bgLoading, setBgLoading] = useState(false);
  const [tolerance, setTolerance] = useState(30);
  const [bgError, setBgError] = useState<string | null>(null);
  const [bgSuccess, setBgSuccess] = useState(false);

  const handleRemoveBackground = async () => {
    if (!editor) return;
    setBgLoading(true);
    setBgError(null);
    setBgSuccess(false);
    try {
      await editor.removeBackgroundFromSelected(tolerance);
      setBgSuccess(true);
      setTimeout(() => setBgSuccess(false), 3000);
    } catch (e: any) {
      setBgError(e.message || 'Failed to remove background');
    } finally {
      setBgLoading(false);
    }
  };

  if (!editor || selection.count === 0) {
    return null;
  }

  const isMulti = selection.count > 1;
  const isImage = obj?.type === 'image';
  const isText = obj?.type === 'textbox' || obj?.type === 'i-text';
  const isGroup = obj?.type === 'group';
  const isDraw = !!obj && (obj.roohAssetType === 'draw' || obj.roohAssetType === 'pen' || obj.roohAssetType === 'signature');
  const activeTool = editor.toolManager.getActiveToolId();
  const isDrawTool = activeTool?.startsWith('draw-');
  const isDrawingMode = isDrawTool || activeTool === 'pen' || activeTool === 'signature';

  // Handle setting active drawing config if in draw mode
  function setDrawConfig(config: any) {
    if (isDrawTool && editor) {
      const engine = (editor as any).toolManager.tools.get(activeTool);
      if (engine && engine.updateProperties) {
        engine.updateProperties(config);
      }
    } else if (obj) {
      set(config);
    }
  }

  // Get current draw config values from either selected object or engine
  const currentDrawConfig = (() => {
    if (obj && isDraw) return obj;
    if (isDrawingMode && isDrawTool) {
      const engine = (editor as any).toolManager.tools.get(activeTool);
      return engine?.getConfig?.() || { color: '#000000', thickness: 5, opacity: 1 };
    }
    return {};
  })();

  const allowOpacity =
    !isMulti &&
    !editor.document.pages.map((p: any) => p.id).includes(selection.ids[0] ?? '') &&
    (isImage || isText || isGroup || isDraw);

  const set = (props: Partial<ObjectSnapshot>) => editor.updateSelection(props);
  const isTextObj = obj?.type === 'textbox' || obj?.type === 'i-text';
  const isShape = obj && !isTextObj && obj.type !== 'image';
  const fontFamilies = [...fonts.map((f) => f.family), ...FONT_FALLBACKS];

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col overflow-y-auto border-l border-[#E7DDD6] bg-[#FFFDF9] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#E7DDD6] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#D0C2AE]">
      <div className="flex items-center justify-between border-b border-[#E7DDD6] p-5 bg-[#FFFDF9]/80 backdrop-blur-sm sticky top-0 z-10">
        <p className="text-[16px] font-primary font-medium tracking-wide text-[#1F1F1F]">
          {selection.count > 1 ? `${selection.count} elements` : obj?.name}
        </p>
        <div className="flex items-center gap-1">
          {/**
           * BUTTON: Duplicate
           *
           * LOCATION:
           * PropertiesPanel Header Actions
           *
           * COMPONENT:
           * PropertiesPanel (Button)
           *
           * CLICK HANDLER:
           * editor.duplicateSelection()
           *
           * FLOW:
           * Button
           * → editor.duplicateSelection()
           * → RoohaeEditor.cloneObject()
           * → newObjectId() + offset coordinates (+10, +10)
           * → canvas.add(cloned) & canvas.setActiveObject(cloned)
           * → pushHistorySnapshot()
           *
           * PURPOSE:
           * Duplicates currently selected object(s) with an offset.
           */ }
          <Tip label="Duplicate (Ctrl+D)">
            <Button variant="ghost" size="icon-sm" onClick={() => void editor.duplicateSelection()}>
              <Copy className="h-4 w-4" />
            </Button>
          </Tip>

          {/**
           * BUTTON: Delete
           *
           * LOCATION:
           * PropertiesPanel Header Actions
           *
           * COMPONENT:
           * PropertiesPanel (Button)
           *
           * CLICK HANDLER:
           * editor.deleteSelection()
           *
           * FLOW:
           * Button
           * → editor.deleteSelection()
           * → canvas.remove(activeObjects)
           * → canvas.discardActiveObject()
           * → pushHistorySnapshot()
           * → emitter.emit('selection:change', { count: 0 })
           *
           * PURPOSE:
           * Deletes currently selected canvas element(s).
           */ }
          <Tip label="Delete (Del)">
            <Button variant="ghost" size="icon-sm" onClick={() => editor.deleteSelection()}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </Tip>
        </div>
      </div>

      <div className="space-y-6 p-5">
        {/* Admin-only: user permission control — the heart of template locking */}
        {isAdmin && obj && (
          <div className="space-y-3 rounded-xl border border-[#E7DDD6] bg-[#F8F4EF]/80 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-[13px] font-medium text-[#1F1F1F]">User editable</Label>
                <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                  Users can modify this element
                </p>
              </div>
              <Switch
                checked={obj.editable}
                onCheckedChange={(checked) => editor.setObjectEditable(obj.id, checked)}
              />
            </div>
            {obj.type === 'image' && obj.editable && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs text-brand-800 dark:text-brand-200">
                    Placeholder name
                  </Label>
                  <input
                    value={obj.placeholderName ?? ''}
                    placeholder="e.g. Profile Photo"
                    onChange={(e) => set({ placeholderName: e.target.value })}
                    className="h-8 w-full rounded-lg border border-brand-200 bg-white px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/60 dark:border-brand-800 dark:bg-slate-900 dark:text-slate-200"
                  />
                  <p className="text-[11px] text-brand-600/80 dark:text-brand-300/80">
                    Shown to users in their Images panel
                  </p>
                </div>

                {/* User Image Permissions */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs text-brand-800 dark:text-brand-200">
                      Allow custom upload
                    </Label>
                    <p className="text-[11px] text-brand-600/80 dark:text-brand-300/80">
                      Users may upload their own image
                    </p>
                  </div>
                  <Switch
                    checked={obj.allowCustomUpload !== false}
                    onCheckedChange={(checked) => set({ allowCustomUpload: checked })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-brand-800 dark:text-brand-200">
                    Allowed replacement assets
                  </Label>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-between gap-2 overflow-hidden"
                    onClick={() => setGalleryOpen(true)}
                    disabled={!assetBrowser}
                  >
                    <span className="truncate">Choose from library</span>
                    <Badge variant={obj.allowedAssetIds?.length ? 'default' : 'muted'} className="shrink-0">
                      {obj.allowedAssetIds?.length ?? 0} selected
                    </Badge>
                  </Button>
                  <p className="text-[11px] text-brand-600/80 dark:text-brand-300/80">
                    Users pick replacements from this gallery
                    {obj.allowCustomUpload === false ? ' (uploads disabled)' : ' or upload their own'}
                  </p>
                </div>

                {assetBrowser && (
                  <AllowedAssetsDialog
                    open={galleryOpen}
                    onOpenChange={setGalleryOpen}
                    assetBrowser={assetBrowser}
                    selectedIds={obj.allowedAssetIds ?? []}
                    onChange={(allowedAssetIds) => set({ allowedAssetIds })}
                  />
                )}
              </>
            )}
          </div>
        )}

        {/* Background Remover */}
        {isImage && obj && (
          <section className="space-y-4 rounded-xl border border-[#E7DDD6]/80 bg-[#F8F4EF]/30 p-4 shadow-sm transition-all duration-200 hover:bg-[#F8F4EF]/50">
            <div className="flex items-center gap-2">
              <Scissors className="h-4 w-4 text-[#8B5CF6]" />
              <Label className="text-[11px] font-secondary tracking-[0.2em] uppercase text-[#1F1F1F] font-bold">
                Background Remover
              </Label>
            </div>
            
            <p className="text-[11px] text-[#6B6B6B] leading-relaxed">
              Instantly remove background pixels using border-color threshold matting. Perfect for graphics, logos, and clean portraits.
            </p>

            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
                <span>Tolerance</span>
                <span className="font-mono text-slate-700">{tolerance}</span>
              </div>
              <Slider
                value={[tolerance]}
                min={5}
                max={80}
                step={1}
                onValueChange={([val]) => setTolerance(val!)}
                className="w-full"
              />
            </div>

            {bgError && (
              <div className="rounded-xl bg-red-50/80 border border-red-200/60 p-3 text-[11px] text-red-600 font-medium">
                {bgError}
              </div>
            )}

            {bgSuccess && (
              <div className="rounded-xl bg-emerald-50/80 border border-emerald-200/60 p-3 text-[11px] text-emerald-600 font-medium">
                ✅ Background removed successfully!
              </div>
            )}

            {/**
             * BUTTON: Remove Background
             *
             * LOCATION:
             * PropertiesPanel Image Tools Section
             *
             * COMPONENT:
             * PropertiesPanel (Button)
             *
             * CLICK HANDLER:
             * handleRemoveBackground()
             *
             * FLOW:
             * Button
             * → handleRemoveBackground()
             * → editor.removeBackgroundFromSelected(tolerance)
             * → RoohaeEditor.removeBackgroundFromSelected()
             * → Offscreen HTML5 Canvas render at native resolution
             * → Perimeter border pixel chroma sampling
             * → Color distance threshold calculation + soft alpha edge matting
             * → FabricImage.fromURL(resultDataUrl)
             * → Swap image layer in-place preserving exact coordinates, scale, and origin
             * → pushHistorySnapshot()
             *
             * PURPOSE:
             * Removes background pixels from the selected raster image layer without coordinate drift.
             */ }
            <Button
              onClick={handleRemoveBackground}
              disabled={bgLoading}
              className={cn(
                'w-full py-2.5 rounded-xl text-white font-bold text-xs shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 border-none',
                bgLoading
                  ? 'bg-slate-300 cursor-not-allowed opacity-60'
                  : 'bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#6D28D9] text-white cursor-pointer'
              )}
            >
              {bgLoading ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <Scissors className="w-3.5 h-3.5" />
                  Remove Background
                </>
              )}
            </Button>
          </section>
        )}

        {/* Sticky Note controls */}
        {!!obj && (obj as any).roohAssetType === 'sticky' && (() => {
          const textObj = obj as any;
          return (
            <section className="space-y-4">
              <Label className="text-[11px] font-secondary tracking-[0.2em] uppercase text-[#6B6B6B]">Sticky Note Options</Label>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Note Text</Label>
                <textarea
                  value={textObj?.text || ''}
                  onChange={(e) => {
                    set({ text: e.target.value });
                  }}
                  placeholder="Type your note here..."
                  rows={3}
                  className="w-full rounded-xl border border-[#E7DDD6] bg-[#FFFDF9] p-2.5 text-xs text-[#1F1F1F] focus:border-[#C5A572] focus:outline-none focus:ring-2 focus:ring-[#C5A572]/20 transition-all resize-none font-sans"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Note Color</Label>
                <ColorField
                  value={textObj.backgroundColor || '#fef08a'}
                  onChange={(color) => {
                    set({ backgroundColor: color });
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Text Color</Label>
                <ColorField
                  value={textObj.fill || '#000000'}
                  onChange={(fill) => {
                    set({ fill });
                  }}
                />
              </div>
            </section>
          );
        })()}

        {/* Draw controls */}
        {(isDraw || isDrawingMode) && (
          <section className="space-y-4">
            <Label className="text-[11px] font-secondary tracking-[0.2em] uppercase text-[#6B6B6B]">Draw Options</Label>
            
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <ColorField value={currentDrawConfig.color || currentDrawConfig.fill || currentDrawConfig.stroke || '#000000'} onChange={(color) => setDrawConfig({ color, stroke: color, fill: '' })} />
                <Label className="text-sm font-medium">Color</Label>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Thickness</Label>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[currentDrawConfig.thickness || currentDrawConfig.strokeWidth || 5]}
                    min={1}
                    max={100}
                    step={1}
                    onValueChange={([val]) => val !== undefined && setDrawConfig({ thickness: val, strokeWidth: val })}
                    className="flex-1"
                  />
                  <span className="text-xs w-8 text-right tabular-nums text-slate-500">
                    {currentDrawConfig.thickness || currentDrawConfig.strokeWidth || 5}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Opacity</Label>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[(currentDrawConfig.opacity ?? 1) * 100]}
                    min={1}
                    max={100}
                    step={1}
                    onValueChange={([val]) => val !== undefined && setDrawConfig({ opacity: val / 100 })}
                    className="flex-1"
                  />
                  <span className="text-xs w-8 text-right tabular-nums text-slate-500">
                    {Math.round((currentDrawConfig.opacity ?? 1) * 100)}%
                  </span>
                </div>
              </div>
              {/* Engine-specific controls */}
              {(() => {
                const drawStyle = isDrawingMode ? activeTool : (obj as any)?.roohDrawStyle;

                return (
                  <>
                    {(drawStyle === 'draw-spray' || drawStyle === 'draw-chalk') && (
                      <div className="space-y-2 mt-2">
                        <Label className="text-sm font-medium">Density</Label>
                        <div className="flex items-center gap-3">
                          <Slider
                            value={[currentDrawConfig.density || 50]}
                            min={1}
                            max={200}
                            step={1}
                            onValueChange={([val]) => val !== undefined && setDrawConfig({ density: val })}
                            className="flex-1"
                          />
                          <span className="text-xs w-8 text-right tabular-nums text-slate-500">
                            {currentDrawConfig.density || 50}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {drawStyle === 'draw-spray' && (
                      <>
                        <div className="space-y-2 mt-2">
                          <Label className="text-sm font-medium">Scatter</Label>
                          <div className="flex items-center gap-3">
                            <Slider
                              value={[currentDrawConfig.scatter || 1]}
                              min={0.1}
                              max={3.0}
                              step={0.1}
                              onValueChange={([val]) => val !== undefined && setDrawConfig({ scatter: val })}
                              className="flex-1"
                            />
                            <span className="text-xs w-8 text-right tabular-nums text-slate-500">
                              {currentDrawConfig.scatter || 1}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2 mt-2">
                          <Label className="text-sm font-medium">Particle Size</Label>
                          <div className="flex items-center gap-3">
                            <Slider
                              value={[currentDrawConfig.particleSize || 2]}
                              min={0.5}
                              max={10}
                              step={0.5}
                              onValueChange={([val]) => val !== undefined && setDrawConfig({ particleSize: val })}
                              className="flex-1"
                            />
                            <span className="text-xs w-8 text-right tabular-nums text-slate-500">
                              {currentDrawConfig.particleSize || 2}
                            </span>
                          </div>
                        </div>
                      </>
                    )}

                    {drawStyle === 'draw-brush' && (
                      <div className="space-y-2 mt-2">
                        <Label className="text-sm font-medium">Flow (Paint Wetness)</Label>
                        <div className="flex items-center gap-3">
                          <Slider
                            value={[(currentDrawConfig.flow ?? 0.5) * 100]}
                            min={1}
                            max={100}
                            step={1}
                            onValueChange={([val]) => val !== undefined && setDrawConfig({ flow: val / 100 })}
                            className="flex-1"
                          />
                          <span className="text-xs w-8 text-right tabular-nums text-slate-500">
                            {Math.round((currentDrawConfig.flow ?? 0.5) * 100)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </section>
        )}

        {/* Text controls */}
        {isText && obj && (
          <section className="space-y-4">
            <Label className="text-[11px] font-secondary tracking-[0.2em] uppercase text-[#6B6B6B]">Typography</Label>
            <Select
              value={obj.fontFamily ?? fontFamilies[0]}
              onValueChange={(fontFamily) => set({ fontFamily })}
            >
              <SelectTrigger className="h-10 text-[13px] font-medium rounded-xl border-[#E7DDD6] bg-white/60 hover:bg-white shadow-sm transition-all focus:ring-[#C5A572]/20">
                <SelectValue placeholder="Font family" />
              </SelectTrigger>
              <SelectContent>
                {fontFamilies.map((family) => (
                  <SelectItem key={family} value={family}>
                    <span style={{ fontFamily: family }}>{family.split(',')[0]}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <NumberField
                label="Size"
                value={obj.fontSize ?? 16}
                min={4}
                max={800}
                onChange={(fontSize) => set({ fontSize })}
              />
              <ColorField value={obj.fill ?? '#000000'} onChange={(fill) => set({ fill })} />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <ToggleButton
                label="Bold"
                active={Number(obj.fontWeight) >= 600 || obj.fontWeight === 'bold'}
                onClick={() =>
                  set({
                    fontWeight:
                      Number(obj.fontWeight) >= 600 || obj.fontWeight === 'bold' ? 400 : 700,
                  })
                }
              >
                <Bold className="h-4 w-4" />
              </ToggleButton>
              <ToggleButton
                label="Italic"
                active={obj.fontStyle === 'italic'}
                onClick={() => set({ fontStyle: obj.fontStyle === 'italic' ? 'normal' : 'italic' })}
              >
                <Italic className="h-4 w-4" />
              </ToggleButton>
              <ToggleButton
                label="Underline"
                active={obj.underline}
                onClick={() => set({ underline: !obj.underline })}
              >
                <Underline className="h-4 w-4" />
              </ToggleButton>
              <ToggleButton
                label="Uppercase"
                active={obj.uppercase}
                onClick={() => set({ uppercase: !obj.uppercase })}
              >
                <CaseUpper className="h-4 w-4" />
              </ToggleButton>
              <span className="mx-1 h-6 w-px bg-[#E7DDD6]" />
              {(
                [
                  ['left', <AlignLeft key="l" className="h-4 w-4" />],
                  ['center', <AlignCenter key="c" className="h-4 w-4" />],
                  ['right', <AlignRight key="r" className="h-4 w-4" />],
                ] as const
              ).map(([align, icon]) => (
                <ToggleButton
                  key={align}
                  label={`Align ${align}`}
                  active={obj.textAlign === align}
                  onClick={() => set({ textAlign: align })}
                >
                  {icon}
                </ToggleButton>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <NumberField
                label="Trk"
                value={obj.charSpacing ?? 0}
                step={10}
                onChange={(charSpacing) => set({ charSpacing })}
              />
              <NumberField
                label="Ln"
                value={obj.lineHeight ?? 1.16}
                step={0.05}
                min={0.5}
                max={4}
                onChange={(lineHeight) => set({ lineHeight })}
              />
            </div>
          </section>
        )}

        {/* Shape controls */}
        {isShape && obj && (
          <section className="space-y-4">
            <Label className="text-[11px] font-secondary tracking-[0.2em] uppercase text-[#6B6B6B]">Appearance</Label>
            <ColorField label="Fill" value={obj.fill ?? '#000000'} onChange={(fill) => set({ fill })} />
            <ColorField
              label="Stroke"
              value={obj.stroke ?? '#000000'}
              onChange={(stroke) => set({ stroke })}
            />
              {obj.type === 'rect' && (
                <div className="w-1/2 pr-1">
                  <NumberField
                    label="Rad"
                    value={obj.rx ?? 0}
                    min={0}
                    onChange={(rx) => set({ rx, ry: rx } as Partial<ObjectSnapshot>)}
                  />
                </div>
              )}

            <div className="pt-2 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-secondary tracking-[0.2em] uppercase text-[#6B6B6B]">Border Thickness</Label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={obj.strokeWidth ?? 1}
                    onChange={(e) => set({ strokeWidth: Number(e.target.value) })}
                    className="h-7 w-12 rounded-lg border border-[#E7DDD6] bg-white text-center text-xs font-medium focus:border-[#C5A572] focus:outline-none focus:ring-1 focus:ring-[#C5A572]/20 shadow-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-[10px] text-[#6B6B6B] font-medium">px</span>
                </div>
              </div>
              
              <Slider
                value={[obj.strokeWidth ?? 1]}
                min={1}
                max={50}
                step={1}
                onValueChange={([val]) => set({ strokeWidth: val })}
                className="w-full"
              />
              
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {[
                  { label: 'Thin', val: 2 },
                  { label: 'Medium', val: 4 },
                  { label: 'Bold', val: 8 },
                  { label: 'Extra', val: 12 },
                ].map((preset) => (
                  <button
                    key={preset.val}
                    onClick={() => set({ strokeWidth: preset.val })}
                    className={cn(
                      "flex flex-col items-center justify-center py-1.5 rounded-lg border transition-all duration-200",
                      obj.strokeWidth === preset.val
                        ? "border-[#C5A572] bg-[#F8F4EF] shadow-sm text-[#1F1F1F]"
                        : "border-[#E7DDD6] bg-white/60 hover:bg-white hover:border-[#D0C2AE] text-[#6B6B6B]"
                    )}
                  >
                    <div 
                      className="w-4 bg-current rounded-full mb-1" 
                      style={{ height: Math.max(1, Math.min(8, preset.val / 2)) }} 
                    />
                    <span className="text-[9px] font-semibold">{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {obj.roohAssetType === 'border' && isAdmin && (
              <div className="pt-2 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-secondary tracking-[0.2em] uppercase text-[#6B6B6B]">Margin / Padding</Label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={obj.roohBorderPadding ?? 0}
                      onChange={(e) => set({ roohBorderPadding: Number(e.target.value) })}
                      className="h-7 w-12 rounded-lg border border-[#E7DDD6] bg-white text-center text-xs font-medium focus:border-[#C5A572] focus:outline-none focus:ring-1 focus:ring-[#C5A572]/20 shadow-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-[10px] text-[#6B6B6B] font-medium">px</span>
                  </div>
                </div>
                <Slider
                  value={[obj.roohBorderPadding ?? 0]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={([val]) => set({ roohBorderPadding: val })}
                  className="w-full"
                />
              </div>
            )}

            {(obj.roohAssetType === 'line' || obj.roohAssetType === 'border') && (
              <div className="pt-2">
                <Label className="text-[11px] font-secondary tracking-[0.2em] uppercase text-[#6B6B6B] mb-2 block">Dash Pattern</Label>
                <div className="flex gap-2">
                  <Button variant={!obj.strokeDashArray ? 'primary' : 'outline'} size="sm" onClick={() => set({ strokeDashArray: null } as any)}>Solid</Button>
                  <Button variant={obj.strokeDashArray?.join(',') === '18,10' ? 'primary' : 'outline'} size="sm" onClick={() => set({ strokeDashArray: [18, 10] } as any)}>Dashed</Button>
                  <Button variant={obj.strokeDashArray?.join(',') === '0,14' ? 'primary' : 'outline'} size="sm" onClick={() => set({ strokeDashArray: [0, 14] } as any)}>Dotted</Button>
                </div>
              </div>
            )}
          </section>
        )}

        {obj && (
          <>
            <Separator className="bg-[#E7DDD6]/60" />
            {/* Transform */}
            <section className="space-y-4">
              <Label className="text-[11px] font-secondary tracking-[0.2em] uppercase text-[#6B6B6B]">Transform</Label>
              <div className="grid grid-cols-2 gap-3">
                <NumberField label="X" value={obj.left} onChange={(left) => set({ left })} />
                <NumberField label="Y" value={obj.top} onChange={(top) => set({ top })} />
                <NumberField label="W" value={obj.width} min={1} onChange={(width) => set({ width })} />
                <NumberField label="H" value={obj.height} min={1} onChange={(height) => set({ height })} />
              </div>
              <div className="flex items-center gap-3">
                <span className="w-12 text-[10px] font-secondary tracking-[0.15em] uppercase text-[#8CA3B0] font-medium">Rotate</span>
                <Slider
                  value={[obj.angle]}
                  min={-180}
                  max={180}
                  step={1}
                  onValueChange={([angle]) => set({ angle })}
                />
                <span className="w-10 text-right text-[12px] font-medium text-[#1F1F1F]">{obj.angle}°</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-12 text-[10px] font-secondary tracking-[0.15em] uppercase text-[#8CA3B0] font-medium">Opacity</span>
                <Slider
                  value={[Math.round(obj.opacity * 100)]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={([v]) => set({ opacity: (v ?? 100) / 100 })}
                />
                <span className="w-10 text-right text-[12px] font-medium text-[#1F1F1F]">
                  {Math.round(obj.opacity * 100)}%
                </span>
              </div>
            </section>


            <Separator className="bg-[#E7DDD6]/60" />
            {/* Arrange */}
            <section className="space-y-3">
              <Label className="text-[11px] font-secondary tracking-[0.2em] uppercase text-[#6B6B6B]">Arrange</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm" className="rounded-xl border-[#E7DDD6] bg-white/60 hover:bg-white text-[12px] text-[#1F1F1F] shadow-sm" onClick={() => editor.align('left')}>Left</Button>
                <Button variant="outline" size="sm" className="rounded-xl border-[#E7DDD6] bg-white/60 hover:bg-white text-[12px] text-[#1F1F1F] shadow-sm" onClick={() => editor.align('center-h')}>Center</Button>
                <Button variant="outline" size="sm" className="rounded-xl border-[#E7DDD6] bg-white/60 hover:bg-white text-[12px] text-[#1F1F1F] shadow-sm" onClick={() => editor.align('right')}>Right</Button>
                <Button variant="outline" size="sm" className="rounded-xl border-[#E7DDD6] bg-white/60 hover:bg-white text-[12px] text-[#1F1F1F] shadow-sm" onClick={() => editor.align('top')}>Top</Button>
                <Button variant="outline" size="sm" className="rounded-xl border-[#E7DDD6] bg-white/60 hover:bg-white text-[12px] text-[#1F1F1F] shadow-sm" onClick={() => editor.align('center-v')}>Middle</Button>
                <Button variant="outline" size="sm" className="rounded-xl border-[#E7DDD6] bg-white/60 hover:bg-white text-[12px] text-[#1F1F1F] shadow-sm" onClick={() => editor.align('bottom')}>Bottom</Button>
              </div>
            </section>

            {/* Shadow */}
            <Separator className="bg-[#E7DDD6]/60" />
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-secondary tracking-[0.2em] uppercase text-[#6B6B6B]">Shadow</Label>
                <Switch
                  checked={Boolean(obj.shadow)}
                  onCheckedChange={(on) =>
                    set({
                      shadow: on
                        ? { color: 'rgba(15,23,42,0.35)', blur: 12, offsetX: 0, offsetY: 6 }
                        : null,
                    })
                  }
                />
              </div>
              {obj.shadow && (
                <div className="grid grid-cols-3 gap-2">
                  <NumberField
                    label="Blur"
                    value={obj.shadow.blur}
                    min={0}
                    onChange={(blur) => set({ shadow: { ...obj.shadow!, blur } })}
                  />
                  <NumberField
                    label="X"
                    value={obj.shadow.offsetX}
                    onChange={(offsetX) => set({ shadow: { ...obj.shadow!, offsetX } })}
                  />
                  <NumberField
                    label="Y"
                    value={obj.shadow.offsetY}
                    onChange={(offsetY) => set({ shadow: { ...obj.shadow!, offsetY } })}
                  />
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </aside>
  );
}

/**
 * Multi-select gallery picker: the admin curates which library images a
 * placeholder may be swapped to. Stores asset IDs only.
 */
function AllowedAssetsDialog({
  open,
  onOpenChange,
  assetBrowser,
  selectedIds,
  onChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetBrowser: AssetBrowserProps;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const selected = new Set(selectedIds);

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange([...next]);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Allowed replacement assets"
        description="Users can swap this image to any of the selected options. Selection saves automatically."
        className="max-w-2xl"
      >
        <div className="space-y-3">
          {assetBrowser.onSearch && (
            <Input
              placeholder="Search library…"
              onChange={(e) => assetBrowser.onSearch!(e.target.value)}
            />
          )}
          <div className="grid max-h-[50vh] grid-cols-4 gap-2 overflow-y-auto pr-1 sm:grid-cols-5">
            {assetBrowser.assets.map((asset) => {
              const thumb = asset.variants.find((v) => v.name === 'thumbnail')?.url ?? asset.url;
              const isSelected = selected.has(asset.id);
              return (
                <button
                  key={asset.id}
                  onClick={() => toggle(asset.id)}
                  title={asset.originalName}
                  className={cn(
                    'relative aspect-square overflow-hidden rounded-xl border-2 transition-all',
                    isSelected
                      ? 'border-brand-500 ring-2 ring-brand-300'
                      : 'border-slate-200 hover:border-brand-300 dark:border-slate-700',
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={thumb}
                    alt={asset.originalName}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  {isSelected && (
                    <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {assetBrowser.assets.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-400">
              No images in the library yet — upload some in the Uploads section.
            </p>
          )}
          <div className="flex items-center justify-between">
            {assetBrowser.hasMore ? (
              <Button
                variant="ghost"
                size="sm"
                loading={assetBrowser.loadingMore}
                onClick={() => assetBrowser.onLoadMore?.()}
              >
                Load more
              </Button>
            ) : (
              <span />
            )}
            <Button size="sm" onClick={() => onOpenChange(false)}>
              Done ({selected.size} selected)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
