'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '../lib/cn';

/* ----------------------------------------------------------------- Button */

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-[14px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C98B9E]/40 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary:
          'bg-[#1F1F1F] text-white shadow-sm hover:bg-[#2A2A2A] hover:-translate-y-[1px]',
        secondary:
          'bg-[#FFFDF9] border border-[#E7DDD6] text-[#1F1F1F] hover:bg-[#F8F4EF]',
        outline:
          'border border-[#E7DDD6] bg-white text-[#1F1F1F] shadow-sm hover:bg-[#F8F4EF]',
        ghost:
          'text-[#6B6B6B] hover:bg-[#E7DDD6]/30 hover:text-[#1F1F1F]',
        danger: 'bg-[#B35B5B] text-white shadow-sm hover:bg-[#9B4F4F]',
      },
      size: {
        sm: 'h-8 px-3 text-[13px]',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-[15px]',
        icon: 'h-9 w-9 p-0',
        'icon-sm': 'h-8 w-8 p-0',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      suppressHydrationWarning
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';

/* ------------------------------------------------------------------ Input */

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      suppressHydrationWarning
      className={cn(
        'flex h-11 w-full rounded-2xl border border-[#E7DDD6] bg-[#FFFDF9] px-4 py-2 text-[14px] text-[#1F1F1F] shadow-sm transition-all placeholder:text-[#6B6B6B]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C98B9E]/30 focus-visible:border-[#C5A572]',
        'disabled:cursor-not-allowed disabled:opacity-50 hover:bg-white',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      suppressHydrationWarning
      className={cn(
        'flex min-h-[100px] w-full rounded-2xl border border-[#E7DDD6] bg-[#FFFDF9] px-4 py-3 text-[14px] text-[#1F1F1F] shadow-sm transition-all placeholder:text-[#6B6B6B]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C98B9E]/30 focus-visible:border-[#C5A572]',
        'disabled:cursor-not-allowed disabled:opacity-50 hover:bg-white',
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';

/* ------------------------------------------------------------------ Label */

export const Label = forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn('text-[13px] font-semibold text-[#1F1F1F]', className)}
    {...props}
  />
));
Label.displayName = 'Label';

/* ------------------------------------------------------------------- Card */

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-[20px] border border-[#E7DDD6] bg-[#FFFDF9] shadow-sm',
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1 p-6 pb-4', className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-[16px] font-primary font-medium text-[#1F1F1F] tracking-tight', className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6 pt-0', className)} {...props} />;
}

/* ------------------------------------------------------------------ Badge */

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide uppercase',
  {
    variants: {
      variant: {
        default: 'bg-[#C5A572]/10 text-[#C5A572]',
        success: 'bg-[#4F7A5A]/10 text-[#4F7A5A]',
        warning: 'bg-[#B8843F]/10 text-[#B8843F]',
        muted: 'bg-[#E7DDD6]/50 text-[#6B6B6B]',
        danger: 'bg-[#B35B5B]/10 text-[#B35B5B]',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

/* --------------------------------------------------------------- Skeleton */

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-2xl bg-[#E7DDD6]/50', className)}
      {...props}
    />
  );
}

/* -------------------------------------------------------------- Separator */

export function Separator({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('h-px w-full bg-[#E7DDD6]', className)} {...props} />
  );
}

/* ------------------------------------------------------------ EmptyState */

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-[#E7DDD6] bg-white/30 backdrop-blur-sm p-14 text-center',
        className,
      )}
    >
      {icon && (
        <div className="mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-[#E7DDD6]/30 text-[#1F1F1F]">
          {icon}
        </div>
      )}
      <p className="text-[20px] font-primary font-medium tracking-tight text-[#1F1F1F]">{title}</p>
      {description && <p className="max-w-md text-[14px] text-[#6B6B6B] font-secondary leading-relaxed">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
