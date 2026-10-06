/**
 * FILE PURPOSE:
 * Central media and graphic asset library management for Roohae Admin.
 *
 * MAIN RESPONSIBILITY:
 * Provides drag-and-drop and file input multi-asset uploading, asset type categorization
 * (all, images, icons), file search, and deletion capabilities.
 *
 * CONNECTED SYSTEMS:
 * - apps/admin/src/lib/queries.ts (useAssets, useUploadAssets, useDeleteAsset)
 * - packages/shared/src/asset-filters.ts (assetMatchesPanel)
 * - apps/api/src/modules/assets/assets.routes.ts
 */

'use client';

import { useRef, useState } from 'react';
import { MoreHorizontal, Search, UploadCloud } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  assetMatchesPanel,
  type AssetPanelType,
} from '@roohae/shared';
import {
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  EmptyState,
  Input,
  Skeleton,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@roohae/ui';
import { PageHeader } from '@/components/AdminShell';
import { useAssets, useDeleteAsset, useUploadAssets } from '@/lib/queries';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Coarse server-side kind per tab; exact separation happens by MIME below. */
const PANEL_KIND: Record<AssetPanelType, string | undefined> = {
  all: undefined,
  images: 'image',
  icons: 'icon',
};

export default function UploadsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [panel, setPanel] = useState<AssetPanelType>('all');
  const [search, setSearch] = useState('');
  const [dragging, setDragging] = useState(false);

  // API QUERIES & MUTATIONS:
  // Fetches asset library and handles file uploads / deletions
  const { data, isLoading } = useAssets({ kind: PANEL_KIND[panel], search });
  const uploadMutation = useUploadAssets();
  const deleteMutation = useDeleteAsset();

  const visibleAssets = (data?.items ?? []).filter((asset) => assetMatchesPanel(asset, panel));

  // FILE UPLOAD HANDLER:
  // Converts FileList to Array and triggers uploadMutation (POST /api/v1/assets)
  function handleFiles(files: FileList | File[]) {
    const picked = Array.from(files);
    if (!picked.length) return;
    uploadMutation.mutate({ files: picked });
  }

  return (
    <>
      <PageHeader
        title="Uploads"
        description="The platform asset library. Originals are stored untouched — thumbnails are generated separately."
        actions={
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
              onChange={(e) => {
                if (e.target.files) handleFiles(e.target.files);
                e.target.value = '';
              }}
            />
            {/* BUTTON:
                Upload assets
                CALLS:
                fileInputRef.current.click() */}
            <Button
              loading={uploadMutation.isPending}
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud className="h-4 w-4" /> Upload assets
            </Button>
          </>
        }
      />

      {/* DROP ZONE:
          Drag-and-drop file upload target */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`mb-6 rounded-2xl border-2 border-dashed p-6 text-center text-sm transition-colors ${
          dragging
            ? 'border-brand-400 bg-brand-50/70 text-brand-600 dark:bg-brand-950/40'
            : 'border-slate-300 text-slate-400 dark:border-slate-700'
        }`}
      >
        Drag & drop PNG, JPG, JPEG, WEBP, SVG or GIF files here
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* TABS:
            Switch between All, Images, and Icons filters */}
        <Tabs value={panel} onValueChange={(v) => setPanel(v as AssetPanelType)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="icons">Icons</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search assets…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      ) : !visibleAssets.length ? (
        <EmptyState
          icon={<UploadCloud className="h-8 w-8" />}
          title="No assets yet"
          description="Upload images or icons for use inside templates."
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {visibleAssets.map((asset) => {
            const thumb = asset.variants.find((v) => v.name === 'thumbnail')?.url;
            return (
              <Card key={asset.id} className="group overflow-hidden">
                <div className="relative aspect-square bg-slate-50 dark:bg-slate-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumb ?? asset.url}
                      alt={asset.originalName}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  <div className="absolute right-1.5 top-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        {/* BUTTON:
                            Asset action dropdown trigger */}
                        <Button variant="outline" size="icon-sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {/* BUTTON:
                            Open asset original full-resolution URL in new tab */}
                        <DropdownMenuItem onSelect={() => window.open(asset.url, '_blank')}>
                          View original
                        </DropdownMenuItem>
                        {/* BUTTON:
                            Delete asset -> DELETE /api/v1/assets/:id */}
                        <DropdownMenuItem destructive onSelect={() => deleteMutation.mutate(asset.id)}>
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <div className="p-2.5">
                  <p className="truncate text-xs font-medium">{asset.originalName}</p>
                  <p className="text-[11px] text-slate-400">
                    {asset.width && asset.height ? `${asset.width}×${asset.height} · ` : ''}
                    {formatBytes(asset.sizeBytes)}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
