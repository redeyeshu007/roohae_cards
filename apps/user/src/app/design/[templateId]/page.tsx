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
