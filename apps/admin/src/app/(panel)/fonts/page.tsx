/**
 * FILE PURPOSE:
 * Custom typography and font asset management page for Roohae Admin.
 *
 * MAIN RESPONSIBILITY:
 * Displays uploaded brand font families and styles, enables uploading multi-weight
 * OTF/TTF/WOFF/WOFF2 font bundles via multipart form data, dynamically registers
 * them in document fonts via loadFonts(), and provides deletion capability.
 *
 * CONNECTED SYSTEMS:
 * - apps/admin/src/lib/queries.ts (useFonts, useUploadFont, useDeleteFont)
 * - packages/editor-sdk/src/fonts.ts (loadFonts)
 * - apps/api/src/modules/fonts/fonts.routes.ts
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, Type } from 'lucide-react';
import { loadFonts } from '@roohae/editor-sdk';
import {
  Button,
  Card,
  Dialog,
  DialogContent,
  EmptyState,
  Input,
  Label,
  Skeleton,
} from '@roohae/ui';
import { PageHeader } from '@/components/AdminShell';
import { useDeleteFont, useFonts, useUploadFont } from '@/lib/queries';

export default function FontsPage() {
  // API QUERIES & MUTATIONS:
  // Fetches fonts list and handles font upload/deletion
  const { data: fonts, isLoading } = useFonts();
  const uploadMutation = useUploadFont();
  const deleteMutation = useDeleteFont();

  const [open, setOpen] = useState(false);
  const [family, setFamily] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // FONT LOADER EFFECT:
  // Registers uploaded font families into browser FontFaceSet for live preview
  useEffect(() => {
    if (fonts?.length) void loadFonts(fonts);
  }, [fonts]);

  // SUBMIT HANDLER:
  // SUBMIT FLOW:
  // Form submission -> uploadMutation.mutateAsync -> POST /api/v1/fonts (FormData) -> resets state
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!files.length) return;
    await uploadMutation.mutateAsync({ family: family.trim(), files });
    setOpen(false);
    setFamily('');
    setFiles([]);
  }

  return (
    <>
      <PageHeader
        title="Fonts"
        description="Brand typefaces available in the editor. Supports OTF, TTF, WOFF and WOFF2."
        actions={
          // BUTTON:
          // Upload font
          // CALLS:
          // setOpen(true)
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Upload font
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : !fonts?.length ? (
        <EmptyState
          icon={<Type className="h-8 w-8" />}
          title="No fonts uploaded"
          description="Upload font families to make them available across all templates."
          action={
            // BUTTON:
            // Empty state upload trigger
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> Upload font
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {fonts.map((font) => (
            <Card key={font.id} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold">{font.family}</p>
                  <p className="text-xs text-slate-400">
                    {font.faces.length} face{font.faces.length === 1 ? '' : 's'} ·{' '}
                    {font.faces.map((f) => f.weight).join(', ')}
                  </p>
                </div>
                {/* BUTTON:
                    Delete font family -> DELETE /api/v1/fonts/:id */}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => deleteMutation.mutate(font.id)}
                  aria-label={`Delete ${font.family}`}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
              <p
                className="mt-4 truncate text-3xl text-slate-800 dark:text-slate-100"
                style={{ fontFamily: font.family }}
              >
                The quick brown fox
              </p>
            </Card>
          ))}
        </div>
      )}

      {/* UPLOAD FONT DIALOG */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          title="Upload font family"
          description="Select every weight/style file for the family — weights are inferred from file names (e.g. Inter-Bold.woff2)."
        >
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="font-family">Family name</Label>
              <Input
                id="font-family"
                required
                placeholder="e.g. Playfair Display"
                value={family}
                onChange={(e) => setFamily(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Font files</Label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".otf,.ttf,.woff,.woff2"
                className="hidden"
                onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
              />
              {/* BUTTON:
                  File picker trigger area */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-xl border-2 border-dashed border-slate-300 p-6 text-sm text-slate-500 hover:border-brand-400 hover:text-brand-600 dark:border-slate-700"
              >
                {files.length
                  ? files.map((f) => f.name).join(', ')
                  : 'Click to choose OTF / TTF / WOFF / WOFF2 files'}
              </button>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              {/* BUTTON:
                  Cancel font dialog */}
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              {/* BUTTON:
                  Submit font upload */}
              <Button type="submit" disabled={!files.length} loading={uploadMutation.isPending}>
                Upload
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
