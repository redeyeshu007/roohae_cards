'use client';

import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Globe2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { ExportService, loadFonts, type RoohaeEditor } from '@roohae/editor-sdk';
import {
  apiErrorMessage,
  Badge,
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
  AUTOSAVE_INTERVAL_MS,
  collectAssetIds,
  EXPORT_FORMATS,
  type ExportFormat,
  isIconAsset,
  isImageAsset,
} from '@roohae/shared';
import {
  useFonts,
  useInfiniteAssets,
  useResolveAssets,
  useSaveTemplate,
  useSetTemplateStatus,
  useTemplate,
  useUploadAssets,
} from '@/lib/queries';

export default function TemplateEditorPage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = use(params);
  const router = useRouter();

  const { data: template, isLoading } = useTemplate(templateId);
  const { data: fonts } = useFonts();
  const [assetSearch, setAssetSearch] = useState('');
  const [assetKind, setAssetKind] = useState('');
  const [assetSort, setAssetSort] = useState<'newest' | 'oldest'>('newest');
  const {
    data: assetPages,
    isLoading: assetsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteAssets({ search: assetSearch, kind: assetKind, sort: assetSort });
  const uploadMutation = useUploadAssets();
  const saveMutation = useSaveTemplate(templateId);
  const statusMutation = useSetTemplateStatus();

  // Assets referenced by the document may be outside the browsed pages —
  // resolve them explicitly so every image always loads.
  const docAssetIds = useMemo(
    () => (template ? collectAssetIds(template.document) : []),
    [template],
  );
  const { data: resolvedDocAssets } = useResolveAssets(docAssetIds);

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

  // Fabric initializes only once everything it needs is ready.
  const assetsReady = !template || docAssetIds.length === 0 || Boolean(resolvedDocAssets);
  const editorReady = Boolean(template) && fontsReady && assetsReady;

  const editorRef = useRef<RoohaeEditor | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [previewFlipped, setPreviewFlipped] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (template) setTitle(template.title);
  }, [template]);

  const browsedAssets = useMemo(
    () => assetPages?.pages.flatMap((p) => p.items) ?? [],
    [assetPages],
  );

  // Resolve assetId → original URL: explicitly-resolved document assets
  // plus everything browsed in the library panel.
  const assetMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const asset of resolvedDocAssets ?? []) map.set(asset.id, asset.url);
    for (const asset of browsedAssets) map.set(asset.id, asset.url);
    return map;
  }, [resolvedDocAssets, browsedAssets]);
  const assetMapRef = useRef(assetMap);
  assetMapRef.current = assetMap;

  const resolveAsset = useCallback((id: string) => assetMapRef.current.get(id), []);

  const persist = useCallback(
    async (withThumbnail = false) => {
      const editor = editorRef.current;
      if (!editor) return;
      setSaveStatus('saving');
      try {
        await saveMutation.mutateAsync({
          title: title || undefined,
          document: editor.getDocument(),
          ...(withThumbnail ? { thumbnail: editor.getThumbnail() } : {}),
        });
        setSaveStatus('saved');
      } catch (err) {
        setSaveStatus('error');
        toast.error(apiErrorMessage(err));
      }
    },
    [saveMutation, title],
  );

  const scheduleAutosave = useCallback(() => {
    setSaveStatus('dirty');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void persist(), AUTOSAVE_INTERVAL_MS);
  }, [persist]);

  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    },
    [],
  );

  async function publish() {
    await persist(true);
    statusMutation.mutate({
      id: templateId,
      status: template?.status === 'published' ? 'draft' : 'published',
    });
  }

  async function openPreview() {
    const editor = editorRef.current;
    if (!editor) return;
    const document = editor.getDocument();
    const exporter = new ExportService(resolveAsset);
    
    setPreviewUrls([]);
    setPreviewFlipped(false);
    setPreviewOpen(true);
    
    const urls = await Promise.all(
      document.pages.map((_, i) => exporter.preview(document, i))
    );
    setPreviewUrls(urls);
  }

  async function download(format: ExportFormat, scale?: number) {
    const editor = editorRef.current;
    if (!editor) return;
    setExporting(true);
    try {
      await persist(true);
      const exporter = new ExportService(resolveAsset);
      await exporter.export(editor.getDocument(), {
        format,
        scale,
        fileName: (title || 'design').replace(/[^\w-]+/g, '-').toLowerCase(),
      });
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setExporting(false);
    }
  }

  const docWidth = template?.document?.width ?? 0;
  const autoScale = template?.document ? ExportService.autoScaleFor(template.document) : 1;
  const baseWidth = Math.round(docWidth * autoScale);

  if (!editorReady || !template) {
    if (!isLoading && !template) {
      return (
        <div className="flex h-screen items-center justify-center bg-slate-100 text-sm text-slate-400 dark:bg-slate-950">
          Template not found.
        </div>
      );
    }
    return <EditorSkeleton label="Preparing the template editor…" />;
  }

  return (
    <>
      <EditorWorkspace
      mode="admin"
      document={template.document}
      title={title}
      onTitleChange={(t) => {
        setTitle(t);
        scheduleAutosave();
      }}
      onBack={() => {
        void persist(true);
        router.push('/templates');
      }}
      resolveAsset={resolveAsset}
      onDocumentChange={scheduleAutosave}
      onReady={(editor) => {
        editorRef.current = editor;
      }}
      saveStatus={saveStatus}
      sidebarSections={['text', 'shapes', 'images', 'background', 'layers']}
      assetBrowser={{
        // MIME-based: only raster images and SVG icons are insertable —
        // a PDF/MP3/MP4 can never appear in the editor's image grid.
        assets: browsedAssets.filter((a) => isImageAsset(a) || isIconAsset(a)),
        loading: assetsLoading,
        onSearch: setAssetSearch,
        onUpload: (files) => uploadMutation.mutate({ files }),
        uploading: uploadMutation.isPending,
        kind: assetKind,
        onKindChange: setAssetKind,
        sort: assetSort,
        onSortChange: setAssetSort,
        hasMore: hasNextPage,
        loadingMore: isFetchingNextPage,
        onLoadMore: () => void fetchNextPage(),
      }}
      fonts={fonts ?? []}
      onPreview={() => void openPreview()}
      topBarActions={
        <>
          <Badge variant={template.status === 'published' ? 'success' : 'warning'} className="capitalize">
            {template.status}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" loading={exporting}>
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
          <Button size="sm" loading={statusMutation.isPending} onClick={() => void publish()}>
            <Globe2 className="h-4 w-4" />
            {template.status === 'published' ? 'Unpublish' : 'Publish'}
          </Button>
        </>
      }
    />
    <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
      <DialogContent 
        title="Preview" 
        className="max-w-4xl bg-[#F8F4EF]"
        style={{
          backgroundImage: 'radial-gradient(#D6CFC4 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      >
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          {previewUrls.length > 0 && (
            <div 
              className="relative w-full max-w-2xl h-[65vh] [perspective:2000px] group cursor-pointer"
              onClick={() => previewUrls.length > 1 && setPreviewFlipped(f => !f)}
            >
              <div 
                className={`relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] ${previewFlipped ? '[transform:rotateY(180deg)]' : ''}`}
              >
                {/* Front */}
                <div className="absolute inset-0 [backface-visibility:hidden] flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={previewUrls[0]}
                    alt="Front preview"
                    className="max-w-full max-h-full object-contain shadow-2xl rounded-sm ring-1 ring-slate-900/5 bg-white" 
                  />
                </div>
                {/* Back */}
                {previewUrls.length > 1 && (
                  <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={previewUrls[1]}
                      alt="Back preview"
                      className="max-w-full max-h-full object-contain shadow-2xl rounded-sm ring-1 ring-slate-900/5 bg-white" 
                    />
                  </div>
                )}
              </div>
            </div>
          )}
          
          {previewUrls.length > 1 && (
            <div className="mt-6 flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={() => setPreviewFlipped(f => !f)}
                className="rounded-full shadow-sm"
              >
                <RefreshCw className="h-4 w-4" />
                Flip Card
              </Button>
              <span className="text-sm text-slate-500">
                {previewFlipped ? 'Back' : 'Front'} Page
              </span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
