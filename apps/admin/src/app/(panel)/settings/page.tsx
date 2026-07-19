'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@roohae/ui';
import { PageHeader } from '@/components/AdminShell';
import { API_BASE_URL } from '@/lib/api';

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Platform configuration overview." />
      <div className="grid max-w-3xl grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Environment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">API endpoint</span>
              <code className="rounded bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800">
                {API_BASE_URL}
              </code>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Storage driver</span>
              <span>Configured server-side (local in development, Cloudflare R2 in production)</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Asset policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <p>• Originals are stored byte-for-byte and never recompressed.</p>
            <p>• Thumbnails are generated as separate derived variants.</p>
            <p>• The editor and all exports always use original-resolution assets.</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
