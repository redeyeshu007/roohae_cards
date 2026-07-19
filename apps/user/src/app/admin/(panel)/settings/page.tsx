'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@roohae/ui';
import { PageHeader } from '@/components/AdminShell';
import { API_BASE_URL } from '@/lib/api';

export default function SettingsPage() {
  return (
    <>
      <PageHeader 
        title="Settings" 
        description="Platform configuration overview." 
        breadcrumb="Admin / Settings"
      />
      <div className="grid max-w-3xl grid-cols-1 gap-6">
        <Card className="rounded-3xl border-[#E7DDD6] bg-[#FFFDF9] shadow-sm">
          <CardHeader>
            <CardTitle className="text-[16px] font-primary font-medium tracking-tight text-[#1F1F1F]">Environment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-[14px]">
            <div className="flex justify-between items-center border-b border-[#E7DDD6]/60 pb-3">
              <span className="font-secondary text-[#6B6B6B]">API endpoint</span>
              <code className="rounded-lg bg-[#F8F4EF] px-2.5 py-1 text-[12px] text-[#1F1F1F] shadow-sm">
                {API_BASE_URL}
              </code>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="font-secondary text-[#6B6B6B]">Storage driver</span>
              <span className="text-[#1F1F1F] font-medium">Configured server-side (local in development, Cloudflare R2 in production)</span>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-[#E7DDD6] bg-[#FFFDF9] shadow-sm">
          <CardHeader>
            <CardTitle className="text-[16px] font-primary font-medium tracking-tight text-[#1F1F1F]">Asset policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-[14px] font-secondary text-[#6B6B6B]">
            <p>• Originals are stored byte-for-byte and never recompressed.</p>
            <p>• Thumbnails are generated as separate derived variants.</p>
            <p>• The editor and all exports always use original-resolution assets.</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
