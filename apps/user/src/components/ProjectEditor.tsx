'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Eye, Save } from 'lucide-react';
import { toast } from 'sonner';
import {
  AUTOSAVE_INTERVAL_MS,
  collectAssetIds,
  EXPORT_FORMATS,
  type ExportFormat,
} from '@roohae/shared';
import { ExportService, loadFonts, type RoohaeEditor } from '@roohae/editor-sdk';
import {
  apiErrorMessage,
  Button,
  Dialog,
  DialogContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  EditorSkeleton,
  EditorWorkspace,
  type SaveStatus,
} from '@roohae/ui';
import {
  useCreateProject,
  useFonts,
  useProject,
  useResolveAssets,
  useSaveProject,
  useTemplate,
  useUploadReplacement,
} from '@/lib/queries';

/**
 * The user customization editor, in two modes sharing one lifecycle:
 *  - DRAFT (templateId, no project yet): edits are temporary; nothing exists
 *    in My Designs until the user clicks Save, which creates the project.
 *  - SAVED (projectId): the saved project loads; autosave keeps it updated.
 *
 * Autosave NEVER creates a project — it activates only after the first
 * manual Save. Fabric mounts only after template JSON + resolved assets +
 * fonts are all ready, so the canvas never renders blank.
 */
export function ProjectEditor({
  initialProjectId,
  templateId,
}: {
  initialProjectId?: string;
  templateId?: string;
}) {
  const router = useRouter();

  const [projectId, setProjectId] = useState(initialProjectId);
  const projectIdRef = useRef(projectId);
  projectIdRef.current = projectId;

  const { data: project, isLoading: projectLoading } = useProject(projectId);
  // Draft sessions load the published template instead.
  const { data: template, isLoading: templateLoading } = useTemplate(
    projectId ? undefined : templateId,
  );
  const { data: fonts } = useFonts();
  const createMutation = useCreateProject();
  const saveMutation = useSaveProject(projectId);
  const uploadReplacementMutation = useUploadReplacement();

  const sourceDoc = project?.document ?? template?.document;
  const sourceTitle = project?.title ?? template?.title ?? '';

  /* ------------------------------------------------ readiness gate */

  const assetIds = useMemo(() => (sourceDoc ? collectAssetIds(sourceDoc) : []), [sourceDoc]);
  const { data: resolvedAssets } = useResolveAssets(assetIds, {
    projectId,
    templateId: projectId ? undefined : templateId,
  });

  // Fonts register with the browser BEFORE the canvas mounts — no swap flash.
  const [fontsReady, setFontsReady] = useState(false);
  useEffect(() => {
    if (!fonts) return;
    let cancelled = false;
    void loadFonts(fonts).finally(() => {
      if (!cancelled) setFontsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [fonts]);

  const assetsReady = assetIds.length === 0 || Boolean(resolvedAssets);
  const ready = Boolean(sourceDoc) && fontsReady && assetsReady;

  /* ------------------------------------------------ asset resolution */

  const uploadedRef = useRef(new Map<string, string>());
  const assetMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const asset of resolvedAssets ?? []) map.set(asset.id, asset.url);
    return map;
  }, [resolvedAssets]);
  const assetMapRef = useRef(assetMap);
  assetMapRef.current = assetMap;
  const resolveAsset = useCallback(
    (id: string) => assetMapRef.current.get(id) ?? uploadedRef.current.get(id),
    [],
  );

  const galleryMap = useMemo(() => {
    const map = new Map<string, { id: string; url: string; thumbUrl?: string; name?: string }>();
    for (const asset of resolvedAssets ?? []) {
      map.set(asset.id, {
        id: asset.id,
        url: asset.url,
        thumbUrl: asset.variants.find((v) => v.name === 'thumbnail')?.url,
        name: asset.originalName,
      });
    }
    return map;
  }, [resolvedAssets]);
  const galleryMapRef = useRef(galleryMap);
  galleryMapRef.current = galleryMap;

  /* ------------------------------------------------ save & autosave */

  const editorRef = useRef<RoohaeEditor | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [title, setTitle] = useState('');
  const titleInitialized = useRef(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (sourceTitle && !titleInitialized.current) {
      titleInitialized.current = true;
      setTitle(sourceTitle);
    }
  }, [sourceTitle]);

  const titleRef = useRef(title);
  titleRef.current = title;
  const templateIdRef = useRef(templateId);
  templateIdRef.current = templateId;

  /** Manual Save (creates the project) or autosave update. */
  const persist = useCallback(
    async (opts: { manual?: boolean; withThumbnail?: boolean } = {}) => {
      const editor = editorRef.current;
      if (!editor) return;

      // Draft session: ONLY a manual Save may create the project.
      if (!projectIdRef.current) {
        if (!opts.manual) return;
        setSaveStatus('saving');
        try {
          const created = await createMutation.mutateAsync({
            templateId: templateIdRef.current!,
            title: titleRef.current || undefined,
            document: editor.getDocument(),
            thumbnail: editor.getThumbnail(),
          });
          setProjectId(created.id);
          // Swap the URL in place — no remount, same editor instance.
          window.history.replaceState(null, '', `/editor/${created.id}`);
          setSaveStatus('saved');
          toast.success('Saved — your design is now in My Designs');
        } catch (err) {
          setSaveStatus('error');
          toast.error(apiErrorMessage(err));
        }
        return;
      }

      setSaveStatus('saving');
      try {
        await saveMutation.mutateAsync({
          title: titleRef.current || undefined,
          document: editor.getDocument(),
          ...(opts.withThumbnail ? { thumbnail: editor.getThumbnail() } : {}),
        });
        setSaveStatus('saved');
        if (opts.manual) toast.success('Design saved');
      } catch (err) {
        setSaveStatus('error');
        toast.error(apiErrorMessage(err));
      }
    },
    [createMutation, saveMutation],
  );

  const scheduleAutosave = useCallback(() => {
    setSaveStatus('dirty');
    // Autosave activates only AFTER the first manual save.
    if (!projectIdRef.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void persist(), AUTOSAVE_INTERVAL_MS);
  }, [persist]);

  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    },
    [],
  );

  /* ------------------------------------------------ preview & export */

  async function openPreview() {
    const editor = editorRef.current;
    if (!editor) return;
    const exporter = new ExportService(resolveAsset);
    const url = await exporter.preview(editor.getDocument(), 0);
    setPreviewUrl(url);
    setPreviewOpen(true);
  }

  async function download(format: ExportFormat, scale?: number) {
    const editor = editorRef.current;
    if (!editor) return;
    setExporting(true);
    try {
      // Update the saved copy first (never creates a project from a draft).
      if (projectIdRef.current) await persist({ withThumbnail: true });
      const exporter = new ExportService(resolveAsset);
      await exporter.export(editor.getDocument(), {
        format,
        scale,
        fileName: (titleRef.current || 'design').replace(/[^\w-]+/g, '-').toLowerCase(),
      });
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setExporting(false);
    }
  }

  const docWidth = sourceDoc?.width ?? 0;
  const autoScale = sourceDoc ? ExportService.autoScaleFor(sourceDoc) : 1;
  const baseWidth = Math.round(docWidth * autoScale);

  /* ------------------------------------------------ render */

  if (!ready) {
    if (!projectLoading && !templateLoading && !sourceDoc) {
      return (
        <div className="flex h-screen flex-col items-center justify-center gap-3 bg-slate-100 dark:bg-slate-950">
          <p className="text-sm text-slate-500">This design is no longer available.</p>
          <Button onClick={() => router.push('/dashboard')}>Browse templates</Button>
        </div>
      );
    }
    return <EditorSkeleton />;
  }

  return (
    <>
      <EditorWorkspace
        mode="user"
        document={sourceDoc}
        title={title}
        onTitleChange={(t) => {
          setTitle(t);
          scheduleAutosave();
        }}
        onBack={() => {
          if (projectIdRef.current) void persist({ withThumbnail: true });
          router.push(projectIdRef.current ? '/projects' : '/dashboard');
        }}
        resolveAsset={resolveAsset}
        onDocumentChange={scheduleAutosave}
        onReady={(editor) => {
          editorRef.current = editor;
        }}
        saveStatus={saveStatus}
        // Customization editor, not a design editor.
        sidebarSections={['placeholders', 'fields']}
        placeholderBrowser={{
          uploadReplacement: async (file) => {
            const assets = await uploadReplacementMutation.mutateAsync(file);
            for (const asset of assets) uploadedRef.current.set(asset.id, asset.url);
            const first = assets[0]!;
            if (assets.length > 1) {
              toast.info(`Uploaded ${assets.length} images — first image applied to this placeholder`);
            }
            return { id: first.id, url: first.url };
          },
          uploading: uploadReplacementMutation.isPending,
          getGalleryAsset: (id) => galleryMapRef.current.get(id),
        }}
        fonts={fonts ?? []}
        topBarActions={
          <>
            <Button
              size="sm"
              variant={projectId ? 'outline' : 'primary'}
              loading={createMutation.isPending || (saveStatus === 'saving' && !exporting)}
              onClick={() => void persist({ manual: true, withThumbnail: true })}
            >
              <Save className="h-4 w-4" /> Save
            </Button>
            <Button variant="outline" size="sm" onClick={() => void openPreview()}>
              <Eye className="h-4 w-4" /> Preview
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant={projectId ? 'primary' : 'outline'} loading={exporting}>
                  <Download className="h-4 w-4" /> Download
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {EXPORT_FORMATS.map((format) => (
                  <DropdownMenuItem key={format} onSelect={() => void download(format)}>
                    {format.toUpperCase()}
                    <span className="ml-auto text-xs text-slate-400">
                      {format === 'pdf' ? 'Print-ready' : `${baseWidth}px wide`}
                    </span>
                  </DropdownMenuItem>
                ))}
                {[2, 4].map((mult) => (
                  <DropdownMenuItem
                    key={mult}
                    onSelect={() => void download('png', autoScale * mult)}
                  >
                    PNG {mult}×
                    <span className="ml-auto text-xs text-slate-400">
                      {baseWidth * mult}px wide
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent 
          title="Preview" 
          className="max-w-3xl bg-[#F8F4EF]"
          style={{
            backgroundImage: 'radial-gradient(#D6CFC4 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        >
          {previewUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={previewUrl}
              alt="Design preview"
              className="max-h-[70vh] w-full rounded-xl object-contain shadow-card"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
