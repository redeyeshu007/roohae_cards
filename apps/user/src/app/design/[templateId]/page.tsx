/**
 * FILE PURPOSE:
 * Draft template designer page wrapper for un-forked templates.
 *
 * MAIN RESPONSIBILITY:
 * Lazily loads the heavy ProjectEditor component with Fabric.js bundle,
 * passing templateId to create a transient editing session before persisting as a project.
 *
 * CONNECTED SYSTEMS:
 * - apps/user/src/components/ProjectEditor.tsx (ProjectEditor)
 * - packages/ui/src/editor/EditorSkeleton.tsx
 */

'use client';

import { use } from 'react';
import dynamic from 'next/dynamic';
import { EditorSkeleton } from '@roohae/ui';

/** Lazy load so the Fabric.js bundle only downloads when the editor is opened. */
const ProjectEditor = dynamic(
  () => import('@/components/ProjectEditor').then((m) => ({ default: m.ProjectEditor })),
  { ssr: false, loading: () => <EditorSkeleton label="Loading editor…" /> },
);

/**
 * Draft session: opening a template creates NOTHING — the user customizes a
 * temporary copy and only an explicit Save creates the project in My Designs.
 */
export default function DraftEditorPage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = use(params);
  return <ProjectEditor templateId={templateId} />;
}
