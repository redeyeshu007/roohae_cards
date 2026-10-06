/**
 * FILE PURPOSE:
 * Saved user project design canvas editing page.
 *
 * MAIN RESPONSIBILITY:
 * Dynamically loads the Fabric.js ProjectEditor client bundle, mounts the user's
 * saved design by projectId, and engages the autosave engine.
 *
 * CONNECTED SYSTEMS:
 * - apps/user/src/components/ProjectEditor.tsx (ProjectEditor)
 * - packages/ui/src/editor/EditorSkeleton.tsx
 */

'use client';

import { use } from 'react';
import dynamic from 'next/dynamic';
import { EditorSkeleton } from '@roohae/ui';

/** Lazy load so the Fabric.js bundle (~500 KB) only downloads when the editor is opened. */
const ProjectEditor = dynamic(
  () => import('@/components/ProjectEditor').then((m) => ({ default: m.ProjectEditor })),
  { ssr: false, loading: () => <EditorSkeleton label="Loading editor…" /> },
);

/** Saved-project editing: loads the existing project; autosave active. */
export default function ProjectEditorPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  return <ProjectEditor initialProjectId={projectId} />;
}
