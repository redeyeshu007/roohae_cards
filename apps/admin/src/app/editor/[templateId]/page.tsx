'use client';

import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Globe2 } from 'lucide-react';
import { toast } from 'sonner';
import { loadFonts, type RoohaeEditor } from '@roohae/editor-sdk';
import {
  apiErrorMessage,
  Badge,
  Button,
  EditorSkeleton,
  EditorWorkspace,
  type SaveStatus,
} from '@roohae/ui';
import {
  AUTOSAVE_INTERVAL_MS,
  collectAssetIds,
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
      topBarActions={
        <>
          <Badge variant={template.status === 'published' ? 'success' : 'warning'} className="capitalize">
            {template.status}
          </Badge>
          <Button size="sm" loading={statusMutation.isPending} onClick={() => void publish()}>
            <Globe2 className="h-4 w-4" />
            {template.status === 'published' ? 'Unpublish' : 'Publish'}
          </Button>
        </>
      }
    />
  );
}
