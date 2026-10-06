/**
 * FILE PURPOSE:
 * Authenticated user homepage and template discovery gallery.
 *
 * MAIN RESPONSIBILITY:
 * Fetches published template catalog and design format categories from backend APIs,
 * supports text search and category filtering, and navigates to the template designer session.
 *
 * CONNECTED SYSTEMS:
 * - apps/user/src/lib/queries.ts (useCategories, useTemplates)
 * - apps/user/src/app/design/[templateId]/page.tsx (navigates here to start design)
 * - apps/api/src/modules/templates/templates.routes.ts
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LayoutTemplate, Search, Sparkles } from 'lucide-react';
import type { Template } from '@roohae/shared';
import { Badge, cn, EmptyState, Skeleton } from '@roohae/ui';
import { useCategories, useTemplates } from '@/lib/queries';
import { useAuthStore } from '@/lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  // FILTER STATES:
  // Tracks active category id filter and search input query
  const [categoryId, setCategoryId] = useState<string>('');
  const [search, setSearch] = useState('');

  // API QUERIES:
  // Fetches available categories and filtered published templates
  const { data: categories } = useCategories();
  const { data: templates, isLoading } = useTemplates({ categoryId, search });

  // NAVIGATION:
  // Launches designer session for the selected template without saving upfront
  function startDesign(template: Template) {
    router.push(`/design/${template.id}`);
  }

  return (
    <>
      {/* ── Hero Banner ── */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative mb-10 overflow-hidden rounded-3xl bg-[#FFFDF9] border border-[#E7DDD6] p-10 shadow-sm"
      >
        {/* Decorative gold blobs */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#C5A572]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 left-20 h-48 w-48 rounded-full bg-[#E8D5B0]/30 blur-2xl" />

        <div className="relative">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#E7DDD6] bg-[#F8F4EF] px-4 py-1.5 text-[12px] font-medium text-[#C5A572]">
            <Sparkles className="h-3.5 w-3.5" />
            Professionally designed templates
          </div>
          <h1 className="text-[32px] font-bold tracking-tight text-[#1F1F1F]">
            What will you design today
            {user ? (
              <span className="text-[#C5A572]">, {user.name.split(' ')[0]}</span>
            ) : ''}?
          </h1>
          <p className="mt-2 max-w-xl text-[15px] text-[#6B6B6B]">
            Choose from beautifully crafted templates and make them yours. Every download is
            full, print-ready quality.
          </p>

          {/* Search */}
          <div className="relative mt-6 max-w-md">
            <Search className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#6B6B6B]" />
            <input
              type="text"
              placeholder="Search templates — invitations, cards, posters…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 w-full rounded-2xl border border-[#E7DDD6] bg-white pl-11 pr-4 text-[14px] text-[#1F1F1F] placeholder:text-[#6B6B6B] shadow-sm focus:border-[#C5A572] focus:outline-none focus:ring-2 focus:ring-[#C5A572]/20 transition-all"
            />
          </div>
        </div>
      </motion.section>

      {/* ── Category Chips ── */}
      <div className="mb-7 flex flex-wrap items-center gap-2">
        <CategoryChip label="All" active={!categoryId} onClick={() => setCategoryId('')} />
        {categories?.map((category) => (
          <CategoryChip
            key={category.id}
            label={category.name}
            active={categoryId === category.id}
            onClick={() => setCategoryId(category.id)}
          />
        ))}
      </div>

      {/* ── Template Gallery ── */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
          ))}
        </div>
      ) : !templates?.length ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-[#E7DDD6] bg-[#FFFDF9] py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F8F4EF]">
            <LayoutTemplate className="h-7 w-7 text-[#C5A572]" />
          </div>
          <p className="text-[16px] font-semibold text-[#1F1F1F]">No templates here yet</p>
          <p className="mt-1 text-[14px] text-[#6B6B6B]">
            New designs are added regularly — check back soon.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {templates.map((template, i) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
            >
              {/* BUTTON / CARD ACTION:
                  Clicking opens temporary draft session for template customization */}
              <div
                className="group overflow-hidden rounded-[32px] border border-[#EADFC8] bg-[#FBF8F1] shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
                onClick={() => startDesign(template)}
              >
                {/* Thumbnail */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F5EFE4] border-b border-[#EADFC8]">
                  {template.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={template.thumbnailUrl}
                      alt={template.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <LayoutTemplate className="h-10 w-10 text-[#C5A572]/40" />
                    </div>
                  )}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 flex items-end bg-gradient-to-t from-[#1F1F1F]/60 via-transparent to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <span className="rounded-xl bg-white/90 backdrop-blur-sm px-3.5 py-1.5 text-[12px] font-semibold text-[#1F1F1F] shadow-sm">
                      Customize →
                    </span>
                  </div>
                </div>

                {/* Card footer */}
                <div className="flex items-start justify-between gap-3 p-5 pt-4">
                  <div className="min-w-0">
                    <p className="truncate text-[16px] font-medium text-[#1F1F1F]">{template.title}</p>
                    <p className="mt-0.5 truncate text-[13px] text-[#7A6B53]">
                      {template.category?.name ?? ''}
                    </p>
                  </div>
                  {template.usageCount > 0 && (
                    <span className="shrink-0 rounded-full bg-[#F5EFE4] border border-[#EADFC8] px-2.5 py-1 text-[11px] font-medium text-[#C5A572]">
                      {template.usageCount} uses
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full px-4 py-2 text-[13px] font-medium transition-all duration-200 border',
        active
          ? 'bg-[#1F1F1F] text-white border-[#1F1F1F] shadow-sm'
          : 'bg-[#FFFDF9] text-[#6B6B6B] border-[#E7DDD6] hover:border-[#C5A572]/60 hover:text-[#1F1F1F] hover:bg-[#F8F4EF]',
      )}
    >
      {label}
    </button>
  );
}
