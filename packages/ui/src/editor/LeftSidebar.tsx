'use client';

import {
  ArrowRight,
  Circle,
  Diamond,
  Heart,
  Hexagon,
  Image as ImageIcon,
  Layers,
  Minus,
  PaintBucket,
  Shapes,
  Square,
  Squircle,
  Star,
  Triangle,
  Type,
  Upload,
} from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Asset, Font } from '@roohae/shared';
import type {
  EditableField,
  ImagePlaceholder,
  LayerEntry,
  RoohaeEditor,
  ShapeKind,
} from '@roohae/editor-sdk';
import { cn } from '../lib/cn';
import { Button, EmptyState, Input, Skeleton } from '../components/basics';
import { ColorField } from './ColorField';
import { LayersPanel } from './LayersPanel';
import { PlaceholdersPanel, type PlaceholderBrowserProps } from './PlaceholdersPanel';
import { EditableFieldsPanel } from './EditableFieldsPanel';

export type SidebarSection =
  | 'text'
  | 'shapes'
  | 'images'
  | 'placeholders'
  | 'fields'
  | 'background'
  | 'layers';

const SECTION_META: Record<SidebarSection, { label: string; icon: ReactNode }> = {
  text: { label: 'Text', icon: <Type className="h-5 w-5 mb-0.5" /> },
  shapes: { label: 'Elements', icon: <Shapes className="h-5 w-5 mb-0.5" /> },
  images: { label: 'Uploads', icon: <ImageIcon className="h-5 w-5 mb-0.5" /> },
  placeholders: { label: 'Editable', icon: <ImageIcon className="h-5 w-5 mb-0.5" /> },
  fields: { label: 'Fields', icon: <Type className="h-5 w-5 mb-0.5" /> },
  background: { label: 'Canvas', icon: <PaintBucket className="h-5 w-5 mb-0.5" /> },
  layers: { label: 'Layers', icon: <Layers className="h-5 w-5 mb-0.5" /> },
};

const ASSET_KIND_FILTERS = [
  { value: '', label: 'All' },
  { value: 'image', label: 'Photos' },
] as const;

const SHAPES: { kind: ShapeKind; icon: ReactNode; label: string }[] = [
  { kind: 'rectangle', icon: <Square className="h-6 w-6" />, label: 'Rectangle' },
  { kind: 'rounded-rectangle', icon: <Squircle className="h-6 w-6" />, label: 'Rounded' },
  { kind: 'circle', icon: <Circle className="h-6 w-6" />, label: 'Circle' },
  { kind: 'triangle', icon: <Triangle className="h-6 w-6" />, label: 'Triangle' },
  { kind: 'diamond', icon: <Diamond className="h-6 w-6" />, label: 'Diamond' },
  { kind: 'star', icon: <Star className="h-6 w-6" />, label: 'Star' },
  { kind: 'polygon', icon: <Hexagon className="h-6 w-6" />, label: 'Hexagon' },
  { kind: 'heart', icon: <Heart className="h-6 w-6" />, label: 'Heart' },
  { kind: 'arrow', icon: <ArrowRight className="h-6 w-6" />, label: 'Arrow' },
  { kind: 'line', icon: <Minus className="h-6 w-6" />, label: 'Line' },
];

export interface AssetBrowserProps {
  assets: Asset[];
  loading?: boolean;
  onSearch?: (q: string) => void;
  /** Admin only: upload handler. Users never upload to the shared library. */
  onUpload?: (files: File[]) => void;
  uploading?: boolean;
  /** Filter by asset kind ('' = all). */
  kind?: string;
  onKindChange?: (kind: string) => void;
  /** Sort by creation date. */
  sort?: 'newest' | 'oldest';
  onSortChange?: (sort: 'newest' | 'oldest') => void;
  /** Infinite scrolling. */
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}

export function EditorLeftSidebar({
  editor,
  sections,
  assetBrowser,
  placeholders,
  placeholderBrowser,
  editableFields,
  fonts: _fonts,
  layers,
}: {
  editor: RoohaeEditor | null;
  sections: SidebarSection[];
  assetBrowser?: AssetBrowserProps;
  placeholders?: ImagePlaceholder[];
  placeholderBrowser?: PlaceholderBrowserProps;
  editableFields?: EditableField[];
  fonts?: Font[];
  layers: LayerEntry[];
}) {
  const [active, setActive] = useState<SidebarSection | null>(sections[0] ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Infinite scrolling: load the next page when the sentinel becomes visible.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || active !== 'images' || !assetBrowser?.onLoadMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && assetBrowser.hasMore && !assetBrowser.loadingMore) {
          assetBrowser.onLoadMore!();
        }
      },
      { rootMargin: '240px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [active, assetBrowser]);

  return (
    <div className="flex h-full shrink-0">
      {/* Icon rail */}
      <nav className="flex w-20 flex-col items-center gap-2 border-r border-[#E7DDD6] bg-[#FFFDF9] py-5 px-1.5 shadow-[2px_0_10px_rgba(0,0,0,0.01)] z-20">
        {sections.map((section) => (
          <button
            key={section}
            onClick={() => setActive(active === section ? null : section)}
            className={cn(
              'flex w-full flex-col items-center justify-center gap-1 rounded-[14px] py-3.5 text-[9px] font-secondary font-bold tracking-[0.1em] uppercase transition-all duration-300 border',
              active === section
                ? 'bg-white border-[#E7DDD6] text-[#C5A572] shadow-[0_2px_8px_rgba(197,165,114,0.15)] ring-1 ring-[#C5A572]/10 translate-x-[2px]'
                : 'border-transparent text-[#8CA3B0] hover:bg-[#F8F4EF]/60 hover:text-[#1F1F1F]',
            )}
          >
            {SECTION_META[section].icon}
            {SECTION_META[section].label}
          </button>
        ))}
      </nav>

      {/* Drawer */}
      {active && (
        <div className="flex w-72 flex-col overflow-hidden border-r border-[#E7DDD6] bg-[#FFFDF9]">
          <div className="flex-1 overflow-y-auto p-4">
            {active === 'text' && (
              <div className="space-y-2">
                <button
                  onClick={() => editor?.addText('heading')}
                  className="w-full rounded-2xl border border-[#E7DDD6] bg-white p-4 text-left text-2xl font-bold text-[#1F1F1F] hover:border-[#C5A572] hover:bg-[#FBF8F1] transition-all"
                >
                  Add a heading
                </button>
                <button
                  onClick={() => editor?.addText('subheading')}
                  className="w-full rounded-2xl border border-[#E7DDD6] bg-white p-4 text-left text-lg font-semibold text-[#1F1F1F]/80 hover:border-[#C5A572] hover:bg-[#FBF8F1] transition-all"
                >
                  Add a subheading
                </button>
                <button
                  onClick={() => editor?.addText('body')}
                  className="w-full rounded-2xl border border-[#E7DDD6] bg-white p-4 text-left text-sm text-[#6B6B6B] hover:border-[#C5A572] hover:bg-[#FBF8F1] transition-all"
                >
                  Add a little bit of body text
                </button>
              </div>
            )}

            {active === 'shapes' && (
              <div className="grid grid-cols-3 gap-2">
                {SHAPES.map((shape) => (
                  <button
                    key={shape.kind}
                    onClick={() => editor?.addShape(shape.kind)}
                    title={shape.label}
                    className="flex aspect-square items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:border-brand-300 hover:bg-brand-50/50 hover:text-brand-600 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    {shape.icon}
                  </button>
                ))}
              </div>
            )}

            {active === 'images' && assetBrowser && (
              <div className="space-y-3">
                {assetBrowser.onUpload && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        // Snapshot before resetting — a live FileList empties on reset.
                        const picked = Array.from(e.target.files ?? []);
                        if (picked.length) assetBrowser.onUpload!(picked);
                        e.target.value = '';
                      }}
                    />
                    <Button
                      variant="secondary"
                      className="w-full"
                      loading={assetBrowser.uploading}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4" /> Upload images
                    </Button>
                  </>
                )}
                {assetBrowser.onSearch && (
                  <Input
                    placeholder="Search images…"
                    onChange={(e) => assetBrowser.onSearch!(e.target.value)}
                  />
                )}
                {(assetBrowser.onKindChange || assetBrowser.onSortChange) && (
                  <div className="flex items-center gap-1.5">
                    {assetBrowser.onKindChange &&
                      ASSET_KIND_FILTERS.map((f) => (
                        <button
                          key={f.value}
                          onClick={() => assetBrowser.onKindChange!(f.value)}
                          className={cn(
                            'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                            (assetBrowser.kind ?? '') === f.value
                              ? 'bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800',
                          )}
                        >
                          {f.label}
                        </button>
                      ))}
                    {assetBrowser.onSortChange && (
                      <button
                        onClick={() =>
                          assetBrowser.onSortChange!(
                            assetBrowser.sort === 'oldest' ? 'newest' : 'oldest',
                          )
                        }
                        className="ml-auto rounded-full px-2.5 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        {assetBrowser.sort === 'oldest' ? 'Oldest first' : 'Newest first'}
                      </button>
                    )}
                  </div>
                )}
                {assetBrowser.loading ? (
                  <div className="grid grid-cols-2 gap-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="aspect-square" />
                    ))}
                  </div>
                ) : assetBrowser.assets.length === 0 ? (
                  <EmptyState
                    title="No images yet"
                    description={
                      assetBrowser.onUpload
                        ? 'Upload PNG, JPG, SVG, WEBP or GIF files.'
                        : 'Your library is managed by the platform team.'
                    }
                    className="p-6"
                  />
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      {assetBrowser.assets.map((asset) => {
                        const thumb =
                          asset.variants.find((v) => v.name === 'thumbnail')?.url ?? asset.url;
                        return (
                          <button
                            key={asset.id}
                            onClick={() => void editor?.addImage(asset.id, asset.url)}
                            className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-50 hover:border-brand-300 dark:border-slate-700 dark:bg-slate-800"
                            title={asset.originalName}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={thumb}
                              alt={asset.originalName}
                              className="h-full w-full object-cover transition-transform group-hover:scale-105"
                              loading="lazy"
                            />
                          </button>
                        );
                      })}
                    </div>
                    {assetBrowser.loadingMore && (
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <Skeleton className="aspect-square" />
                        <Skeleton className="aspect-square" />
                      </div>
                    )}
                    {/* Infinite-scroll sentinel */}
                    <div ref={sentinelRef} className="h-1" />
                  </>
                )}
              </div>
            )}

            {active === 'placeholders' && placeholderBrowser && (
              <PlaceholdersPanel
                editor={editor}
                placeholders={placeholders ?? []}
                browser={placeholderBrowser}
              />
            )}

            {active === 'fields' && (
              <EditableFieldsPanel editor={editor} fields={editableFields ?? []} />
            )}

            {active === 'background' && editor && (
              <div className="space-y-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Page color
                </p>
                <ColorField
                  value={editor.getPageBackground()}
                  onChange={(hex) => editor.setPageBackground(hex)}
                />
                <div className="grid grid-cols-6 gap-2">
                  {['#ffffff', '#f8fafc', '#fef3c7', '#dcfce7', '#dbeafe', '#fce7f3', '#ede9fe', '#0f172a', '#1e293b', '#7c3aed', '#0ea5e9', '#f43f5e'].map(
                    (hex) => (
                      <button
                        key={hex}
                        onClick={() => editor.setPageBackground(hex)}
                        className="aspect-square rounded-lg border border-slate-200 shadow-sm dark:border-slate-700"
                        style={{ backgroundColor: hex }}
                        aria-label={`Background ${hex}`}
                      />
                    ),
                  )}
                </div>
              </div>
            )}

            {active === 'layers' && <LayersPanel editor={editor} layers={layers} />}
          </div>
        </div>
      )}
    </div>
  );
}
