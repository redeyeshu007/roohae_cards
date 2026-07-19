'use client';

import { CheckCircle2, Images, ImageIcon, Upload } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { REPLACEMENT_ACCEPT, REPLACEMENT_MAX_MB } from '@roohae/shared';
import type { ImagePlaceholder, RoohaeEditor } from '@roohae/editor-sdk';
import { cn } from '../lib/cn';
import { Button, EmptyState, Input } from '../components/basics';
import { Dialog, DialogContent } from '../components/overlays';

export interface GalleryAssetInfo {
  id: string;
  url: string;
  thumbUrl?: string;
  name?: string;
}

export interface PlaceholderBrowserProps {
  /** Upload the file and return the stored asset. Never compresses the original. */
  uploadReplacement: (file: File) => Promise<{ id: string; url: string; fit?: 'stretch' | 'contain' }>;
  uploading?: boolean;
  /** Resolve an allowed gallery asset id to its display info. */
  getGalleryAsset?: (assetId: string) => GalleryAssetInfo | undefined;
}

/**
 * The "Editable Images" panel (user editor only). Lists ONLY the image
 * placeholders the administrator marked editable — locked images never
 * appear here. Two replacement paths per placeholder, both admin-controlled:
 *   - Choose From Gallery: the admin-curated allowedAssetIds (never the
 *     full library)
 *   - Upload Custom Image: only when allowCustomUpload is enabled
 * Replacements touch ONLY the user's project copy; templates are immutable.
 */
export function PlaceholdersPanel({
  editor,
  placeholders,
  browser,
}: {
  editor: RoohaeEditor | null;
  placeholders: ImagePlaceholder[];
  browser: PlaceholderBrowserProps;
}) {
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [galleryFor, setGalleryFor] = useState<ImagePlaceholder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingRef = useRef<ImagePlaceholder | null>(null);

  const filtered = useMemo(
    () =>
      placeholders.filter((p) => p.label.toLowerCase().includes(search.trim().toLowerCase())),
    [placeholders, search],
  );

  function requestUpload(placeholder: ImagePlaceholder) {
    if (!placeholder.allowCustomUpload) return;
    pendingRef.current = placeholder;
    fileInputRef.current?.click();
  }

  async function onFilePicked(files: FileList | null) {
    const file = files?.[0];
    const placeholder = pendingRef.current;
    pendingRef.current = null;
    if (!file || !placeholder || !editor) return;

    const accept = placeholder.accept?.length ? placeholder.accept : [...REPLACEMENT_ACCEPT];
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!accept.includes(ext === 'jpeg' ? 'jpg' : ext) && !accept.includes(ext)) {
      toast.error(`"${placeholder.label}" accepts: ${accept.join(', ').toUpperCase()}`);
      return;
    }
    const maxMB = placeholder.maxSizeMB ?? REPLACEMENT_MAX_MB;
    if (file.size > maxMB * 1024 * 1024) {
      toast.error(`Image must be smaller than ${maxMB} MB`);
      return;
    }

    setBusyId(placeholder.id);
    try {
      const asset = await browser.uploadReplacement(file);
      await editor.replaceImage(placeholder.id, asset.id, asset.url, { fit: asset.fit });
      toast.success(`Replaced "${placeholder.label}"`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Replacement failed');
    } finally {
      setBusyId(null);
    }
  }

  async function pickFromGallery(placeholder: ImagePlaceholder, asset: GalleryAssetInfo) {
    if (!editor) return;
    setGalleryFor(null);
    setBusyId(placeholder.id);
    try {
      await editor.replaceImage(placeholder.id, asset.id, asset.url);
      toast.success(`Replaced "${placeholder.label}"`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Replacement failed');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          void onFilePicked(e.target.files);
          e.target.value = '';
        }}
      />

      <Input placeholder="Search images…" value={search} onChange={(e) => setSearch(e.target.value)} />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<ImageIcon className="h-7 w-7" />}
          title="No editable images"
          description="This design has no image placeholders you can replace."
          className="p-6"
        />
      ) : (
        <ul className="space-y-2.5">
          {filtered.map((placeholder) => {
            const hasGallery = placeholder.allowedAssetIds.length > 0;
            const busy = busyId === placeholder.id;
            return (
              <li
                key={placeholder.id}
                className={cn(
                  'rounded-xl border p-2.5 transition-colors',
                  placeholder.selected
                    ? 'border-brand-400 bg-brand-50/70 ring-1 ring-brand-300 dark:border-brand-600 dark:bg-brand-950/40'
                    : 'border-slate-200 dark:border-slate-700',
                )}
              >
                <button
                  className="flex w-full items-center gap-3 text-left"
                  onClick={() => editor?.selectObject(placeholder.id)}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-slate-400 dark:bg-slate-800">
                    {placeholder.src ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={placeholder.src}
                        alt={placeholder.label}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <ImageIcon className="h-5 w-5" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                      {placeholder.label}
                    </span>
                    <span
                      className={cn(
                        'flex items-center gap-1 text-xs',
                        placeholder.replaced
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-400',
                      )}
                    >
                      {busy ? (
                        'Uploading…'
                      ) : placeholder.replaced ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Uploaded
                        </>
                      ) : (
                        <>
                          <Upload className="h-3.5 w-3.5" /> Waiting for upload
                        </>
                      )}
                    </span>
                  </span>
                </button>

                <div className="mt-2 flex gap-1.5">
                  {hasGallery && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      disabled={busy}
                      onClick={() => {
                        editor?.selectObject(placeholder.id);
                        setGalleryFor(placeholder);
                      }}
                    >
                      <Images className="h-3.5 w-3.5" /> Gallery
                    </Button>
                  )}
                  {placeholder.allowCustomUpload ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      disabled={busy}
                      onClick={() => {
                        editor?.selectObject(placeholder.id);
                        requestUpload(placeholder);
                      }}
                    >
                      <Upload className="h-3.5 w-3.5" /> Upload
                    </Button>
                  ) : (
                    !hasGallery && (
                      <p className="flex-1 py-1.5 text-center text-[11px] text-slate-400">
                        No replacement options
                      </p>
                    )
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-[11px] leading-relaxed text-slate-400">
        PNG, JPG or WEBP up to {REPLACEMENT_MAX_MB} MB. Locked images are managed by the design
        team and cannot be changed.
      </p>

      {/* Choose From Gallery — ONLY the admin-curated options, never the library */}
      <Dialog open={Boolean(galleryFor)} onOpenChange={(open) => !open && setGalleryFor(null)}>
        <DialogContent
          title={galleryFor ? `Choose image — ${galleryFor.label}` : 'Choose image'}
          description="Pick one of the approved options for this image."
          className="max-w-xl"
        >
          {galleryFor && (
            <div className="grid max-h-[55vh] grid-cols-3 gap-2.5 overflow-y-auto pr-1 sm:grid-cols-4">
              {galleryFor.allowedAssetIds
                .map((id) => browser.getGalleryAsset?.(id))
                .filter((a): a is GalleryAssetInfo => Boolean(a))
                .map((asset) => (
                  <button
                    key={asset.id}
                    onClick={() => void pickFromGallery(galleryFor, asset)}
                    title={asset.name}
                    className={cn(
                      'relative aspect-square overflow-hidden rounded-xl border-2 transition-all',
                      galleryFor.assetId === asset.id
                        ? 'border-brand-500 ring-2 ring-brand-300'
                        : 'border-slate-200 hover:border-brand-400 dark:border-slate-700',
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={asset.thumbUrl ?? asset.url}
                      alt={asset.name ?? 'Gallery option'}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    {galleryFor.assetId === asset.id && (
                      <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
                        ✓
                      </span>
                    )}
                  </button>
                ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
