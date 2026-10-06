/**
 * FILE PURPOSE:
 * User saved projects management gallery ("My Designs").
 *
 * MAIN RESPONSIBILITY:
 * Lists the authenticated user's saved project designs, supports text search filtering,
 * provides one-click navigation back into the editor (/editor/[projectId]), and allows deletion.
 *
 * CONNECTED SYSTEMS:
 * - apps/user/src/lib/queries.ts (useProjects, useDeleteProject)
 * - apps/user/src/app/editor/[projectId]/page.tsx
 * - apps/api/src/modules/projects/projects.routes.ts
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FolderHeart, MoreHorizontal, Search } from 'lucide-react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Skeleton,
} from '@roohae/ui';
import { useDeleteProject, useProjects } from '@/lib/queries';

export default function ProjectsPage() {
  const [search, setSearch] = useState('');
  // API QUERIES & MUTATIONS:
  // Fetches user's saved projects and handles project deletion
  const { data: projects, isLoading } = useProjects(search);
  const deleteMutation = useDeleteProject();

  return (
    <>
      {/* ── Page header ── */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-[#1F1F1F]">My Designs</h1>
          <p className="mt-1 text-[14px] text-[#6B6B6B]">
            Everything you have customized, autosaved as you work.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-72">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B6B6B]" />
          <input
            type="text"
            placeholder="Search designs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-full border border-[#E7DDD6] bg-white/60 pl-11 pr-4 text-[14px] text-[#1F1F1F] placeholder:text-[#6B6B6B] focus:border-[#C5A572] focus:outline-none focus:ring-2 focus:ring-[#C5A572]/20 transition-all"
          />
        </div>
      </div>

      {/* ── Grid ── */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/3] rounded-[32px]" />
          ))}
        </div>
      ) : !projects?.length ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-[#E7DDD6] bg-[#FFFDF9] py-24 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F8F4EF]">
            <FolderHeart className="h-7 w-7 text-[#C5A572]" />
          </div>
          <p className="text-[16px] font-semibold text-[#1F1F1F]">No designs yet</p>
          <p className="mt-1 text-[14px] text-[#6B6B6B]">
            Browse templates on the home page and customize one to get started.
          </p>
          {/* BUTTON:
              Navigate to template gallery */}
          <button
            onClick={() => (window.location.href = '/dashboard')}
            className="mt-6 rounded-full bg-[#1F1F1F] px-6 py-2.5 text-[14px] font-medium text-white transition-all hover:bg-[#3A3A3A]"
          >
            Browse templates
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {projects.map((project) => (
            <div
              key={project.id}
              className="group overflow-hidden rounded-[32px] border border-[#EADFC8] bg-[#FBF8F1] shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
            >
              {/* Thumbnail */}
              <Link href={`/editor/${project.id}`} className="block">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F5EFE4] border-b border-[#EADFC8]">
                  {project.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={project.thumbnailUrl}
                      alt={project.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <FolderHeart className="h-10 w-10 text-[#C5A572]/40" />
                    </div>
                  )}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 flex items-end bg-gradient-to-t from-[#1F1F1F]/60 via-transparent to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <span className="rounded-xl bg-white/90 backdrop-blur-sm px-3.5 py-1.5 text-[12px] font-semibold text-[#1F1F1F] shadow-sm">
                      Continue editing →
                    </span>
                  </div>
                </div>
              </Link>

              {/* Card footer */}
              <div className="flex items-start justify-between gap-2 p-5 pt-4">
                <div className="min-w-0">
                  <p className="truncate text-[16px] font-medium text-[#1F1F1F]">{project.title}</p>
                  <p className="mt-0.5 text-[12px] text-[#7A6B53]">
                    Edited {new Date(project.lastEditedAt).toLocaleDateString()}
                  </p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    {/* BUTTON:
                        Project actions dropdown menu */}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="-mr-1 -mt-0.5 text-[#8C7A5E] hover:text-[#1F1F1F] hover:bg-[#1F1F1F]/5"
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    {/* BUTTON:
                        Open project in editor */}
                    <DropdownMenuItem
                      onSelect={() => (window.location.href = `/editor/${project.id}`)}
                    >
                      Open
                    </DropdownMenuItem>
                    {/* BUTTON:
                        Delete project -> DELETE /api/v1/projects/:id */}
                    <DropdownMenuItem
                      destructive
                      onSelect={() => deleteMutation.mutate(project.id)}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
