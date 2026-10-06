/**
 * FILE PURPOSE:
 * Brand font management and upload interface for admin inside user app.
 *
 * MAIN RESPONSIBILITY:
 * Lists installed brand font families and weights, enables multipart font file upload
 * (.otf, .ttf, .woff, .woff2), dynamically registers faces via loadFonts(), and supports deletion.
 *
 * CONNECTED SYSTEMS:
 * - apps/user/src/lib/admin-queries.ts (useFonts, useUploadFont, useDeleteFont)
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
import { useDeleteFont, useFonts, useUploadFont } from '@/lib/admin-queries';

export default function FontsPage() {
  const { data: fonts, isLoading } = useFonts();
  const uploadMutation = useUploadFont();
  const deleteMutation = useDeleteFont();

  const [open, setOpen] = useState(false);
  const [family, setFamily] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Register uploaded families so previews render in their own face.
  useEffect(() => {
    if (fonts?.length) void loadFonts(fonts);
  }, [fonts]);

  // SUBMIT FLOW:
  // Form submission -> uploadMutation -> POST /api/v1/fonts (FormData) -> resets dialog
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
        breadcrumb="Admin / Fonts"
        actions={
          // BUTTON:
          // Open upload font dialog
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
          icon={<Type className="h-10 w-10" />}
          title="No fonts uploaded"
          description="Upload font families to make them available across all templates."
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> Upload font
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {fonts.map((font) => (
            <Card key={font.id} className="p-6 rounded-3xl border-[#E7DDD6] bg-[#FFFDF9] shadow-sm transition-all hover:bg-white hover:shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[15px] font-primary font-medium text-[#1F1F1F]">{font.family}</p>
                  <p className="mt-1 text-[13px] font-secondary text-[#6B6B6B]">
                    {font.faces.length} face{font.faces.length === 1 ? '' : 's'} ·{' '}
                    {font.faces.map((f) => f.weight).join(', ')}
                  </p>
                </div>
                {/* BUTTON:
                    Delete font family */}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => deleteMutation.mutate(font.id)}
                  aria-label={`Delete ${font.family}`}
                >
                  <Trash2 className="h-4 w-4 text-[#B35B5B]" />
                </Button>
              </div>
              <p
                className="mt-6 truncate text-3xl text-[#1F1F1F]"
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
          className="max-w-lg"
        >
          <form onSubmit={onSubmit} className="space-y-6 pt-2">
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
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="group w-full rounded-3xl border-2 border-dashed border-[#E7DDD6] bg-[#FFFDF9] p-8 text-center transition-all hover:border-[#C5A572] hover:bg-[#FBF8F1]"
              >
                {files.length ? (
                  <div className="space-y-1">
                    <p className="text-[13px] font-medium text-[#C5A572]">
                      {files.length} file{files.length === 1 ? '' : 's'} selected
                    </p>
                    <p className="text-[12px] text-[#6B6B6B] leading-relaxed">
                      {files.map((f) => f.name).join(', ')}
                    </p>
                    <p className="text-[11px] text-[#C5A572]/70 mt-2">Click to change selection</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C5A572]/10">
                      <Type className="h-6 w-6 text-[#C5A572]" />
                    </div>
                    <div>
                      <p className="text-[14px] font-medium text-[#1F1F1F]">Drop font files here</p>
                      <p className="mt-1 text-[12px] text-[#6B6B6B]">or click to browse — OTF, TTF, WOFF, WOFF2</p>
                    </div>
                  </div>
                )}
              </button>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
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
