'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import type { DesignDocument, Font } from '@roohae/shared';
import { loadFonts, type EditorMode, type RoohaeEditor } from '@roohae/editor-sdk';
import { useRoohaeEditor } from '@roohae/editor-sdk';
import { Skeleton } from '../components/basics';
import { EditorTopBar, type SaveStatus } from './TopBar';
import { EditorLeftSidebar, type AssetBrowserProps, type SidebarSection } from './LeftSidebar';
import { PropertiesPanel } from './PropertiesPanel';
import { PagesBar } from './PagesBar';
import type { PlaceholderBrowserProps } from './PlaceholdersPanel';

export interface EditorWorkspaceProps {
  mode: EditorMode;
  document: DesignDocument | undefined;
  title: string;
  onTitleChange?: (title: string) => void;
  onBack: () => void;
  resolveAsset: (assetId: string) => string | undefined;
  /** Called (debounce upstream) whenever the design changes — autosave hook. */
  onDocumentChange?: () => void;
  onReady?: (editor: RoohaeEditor) => void;
  saveStatus?: SaveStatus;
  topBarActions?: ReactNode;
  sidebarSections: SidebarSection[];
  assetBrowser?: AssetBrowserProps;
  /** User editor: replacement uploads for editable image placeholders. */
  placeholderBrowser?: PlaceholderBrowserProps;
  fonts: Font[];
}

/**
 * The complete Canva-style editing surface, shared by the admin template
 * editor and the user project editor. All canvas behavior flows through the
 * Editor SDK — no Fabric imports anywhere in this tree.
 */
export function EditorWorkspace(props: EditorWorkspaceProps) {
  const stageRef = useRef<HTMLDivElement>(null);

  const {
    canvasRef,
    editor,
    ready,
    selection,
    layers,
    pages,
    zoom,
    canUndo,
    canRedo,
  } = useRoohaeEditor({
    mode: props.mode,
    document: props.document,
    resolveAsset: props.resolveAsset,
    onDocumentChange: props.onDocumentChange,
  });

  // Register uploaded fonts with the browser so the canvas can use them.
  useEffect(() => {
    if (props.fonts.length) void loadFonts(props.fonts);
  }, [props.fonts]);

  // Fit the design into the stage once the editor is live.
  useEffect(() => {
    if (!editor || !ready || !stageRef.current) return;
    const { clientWidth, clientHeight } = stageRef.current;
    editor.zoomToFit(clientWidth, clientHeight);
    props.onReady?.(editor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, ready]);

  // Keyboard shortcuts.
  useEffect(() => {
    if (!editor) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      const mod = e.ctrlKey || e.metaKey;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        editor.deleteSelection();
      } else if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        void editor.undo();
      } else if (mod && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        e.preventDefault();
        void editor.redo();
      } else if (mod && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        void editor.duplicateSelection();
      } else if (mod && e.key.toLowerCase() === 'c') {
        void editor.copy();
      } else if (mod && e.key.toLowerCase() === 'v') {
        void editor.paste();
      } else if (mod && e.key === '=') {
        e.preventDefault();
        editor.zoomIn();
      } else if (mod && e.key === '-') {
        e.preventDefault();
        editor.zoomOut();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [editor]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#F0EBE3]">
      <EditorTopBar
        title={props.title}
        onTitleChange={props.onTitleChange}
        onBack={props.onBack}
        editor={editor}
        canUndo={canUndo}
        canRedo={canRedo}
        saveStatus={props.saveStatus}
        actions={props.topBarActions}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="relative z-10 h-full shrink-0">
          <EditorLeftSidebar
            editor={editor}
            sections={props.sidebarSections}
            assetBrowser={props.assetBrowser}
            placeholders={editor && ready ? editor.getImagePlaceholders() : []}
            placeholderBrowser={props.placeholderBrowser}
            editableFields={editor && ready ? editor.getEditableFields() : []}
            fonts={props.fonts}
            layers={layers}
          />
        </div>

        {/* Canvas stage */}
        <div
          ref={stageRef}
          className="relative min-w-0 flex-1 overflow-auto bg-[#F8F4EF]"
          style={{ 
            display: 'grid', 
            placeItems: 'start center',
            backgroundImage: 'radial-gradient(#D6CFC4 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        >
          <div className="p-10 relative z-10">
            {!ready && (
              <div className="absolute inset-10">
                <Skeleton className="h-full w-full" />
              </div>
            )}
            <div className="shadow-float ring-1 ring-slate-900/5">
              <canvas ref={canvasRef} />
            </div>
          </div>
        </div>

        {/* Users customize via the Editable panels — no free-form property editing. */}
        {props.mode === 'admin' && (
          <div className="relative z-10 h-full shrink-0">
            <PropertiesPanel
              editor={editor}
              selection={selection}
              fonts={props.fonts}
              isAdmin
              assetBrowser={props.assetBrowser}
            />
          </div>
        )}
      </div>

      <PagesBar
        editor={editor}
        pages={pages}
        zoom={zoom}
        allowPageManagement={props.mode === 'admin'}
      />
    </div>
  );
}
