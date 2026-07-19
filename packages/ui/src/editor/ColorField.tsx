'use client';

import { cn } from '../lib/cn';

export function ColorField({
  label,
  value,
  onChange,
  className,
}: {
  label?: string;
  value: string;
  onChange: (hex: string) => void;
  className?: string;
}) {
  const safe = /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000';
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {label && <span className="w-16 shrink-0 text-xs text-slate-500">{label}</span>}
      <label className="relative h-8 w-8 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-slate-200 shadow-sm dark:border-slate-700">
        <span className="absolute inset-0" style={{ backgroundColor: safe }} />
        <input
          type="color"
          value={safe}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-20 rounded-lg border border-slate-200 bg-white px-2 font-mono text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        spellCheck={false}
      />
    </div>
  );
}
