import React from 'react';
import { cn } from '../../lib/utils.js';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shimmer?: boolean;
}

export function Skeleton({ className, shimmer = true, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-md bg-muted/80',
        shimmer && 'skeleton-shimmer',
        className
      )}
      {...props}
    />
  );
}

/**
 * Service / Template Card Skeleton
 * Exactly mirrors Card, CardHeader, CardContent, CardFooter layout
 */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-col justify-between bg-card border border-border rounded-xl p-5 shadow-xs space-y-4',
        className
      )}
    >
      <div className="space-y-3">
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-5 w-28 rounded-md" />
          <Skeleton className="h-5 w-16 rounded-md" />
        </div>

        {/* Title */}
        <div className="space-y-1.5 pt-1">
          <Skeleton className="h-6 w-5/6" />
          <Skeleton className="h-6 w-3/5" />
        </div>

        {/* Description */}
        <div className="space-y-1.5 pt-1">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-4/5" />
        </div>

        {/* Metadata bullet */}
        <div className="pt-2 flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-3.5 w-40" />
        </div>
      </div>

      {/* Button */}
      <div className="pt-2">
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Grid of Card Skeletons
 */
export function CardGridSkeleton({ count = 6, columns = 3 }: { count?: number; columns?: 2 | 3 }) {
  const colClass = columns === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
  return (
    <div className={cn('grid gap-6', colClass)}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Detail Page Skeleton (for /services/:slug and /documents/:slug)
 */
export function DetailPageSkeleton() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      {/* Back link */}
      <Skeleton className="h-5 w-36" />

      {/* Main card */}
      <div className="bg-card border border-border rounded-xl p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="space-y-3 pb-6 border-b border-border">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-32 rounded-md" />
            <Skeleton className="h-6 w-24 rounded-md" />
          </div>
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        {/* Checklist / requirements section */}
        <div className="space-y-3">
          <Skeleton className="h-5 w-48" />
          <div className="space-y-2">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex items-center gap-3 p-3 rounded-lg border border-border/70 bg-muted/30">
                <Skeleton className="h-5 w-5 rounded-full shrink-0" />
                <div className="space-y-1 w-full">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Button */}
        <div className="pt-4 flex justify-end">
          <Skeleton className="h-11 w-44 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/**
 * Dynamic Form Skeleton (for /create/:templateId and /services/:slug/apply)
 */
export function FormSkeleton() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto py-2">
      {/* Top Stepper bar */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border shadow-xs">
        <div className="flex items-center gap-3 w-full">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <Skeleton className="h-7 w-7 rounded-full shrink-0" />
              <Skeleton className="h-4 w-20 hidden sm:block" />
            </div>
          ))}
        </div>
      </div>

      {/* Main Form Fields Card */}
      <div className="bg-card border border-border rounded-xl p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="space-y-2 pb-4 border-b border-border">
          <Skeleton className="h-7 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        {/* Inputs */}
        <div className="space-y-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3.5 w-16" />
              </div>
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/**
 * Document Preview Skeleton (for /preview/:sessionId)
 */
export function PreviewSkeleton() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Top Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border shadow-xs">
        <Skeleton className="h-6 w-48" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </div>

      {/* Simulated A4 Paper */}
      <div className="bg-white border border-border/80 shadow-md rounded-xl p-8 sm:p-12 min-h-[700px] space-y-8 max-w-3xl mx-auto">
        {/* Official Header */}
        <div className="text-center space-y-2 pb-6 border-b border-border/50">
          <Skeleton className="h-6 w-48 mx-auto" />
          <Skeleton className="h-4 w-72 mx-auto" />
        </div>

        {/* Document Title */}
        <div className="space-y-2 text-center py-2">
          <Skeleton className="h-7 w-2/3 mx-auto" />
          <Skeleton className="h-4 w-1/3 mx-auto" />
        </div>

        {/* Paragraphs */}
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <div className="space-y-2 pt-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>

        {/* Signature Box */}
        <div className="pt-16 flex justify-end">
          <div className="space-y-2 w-48 text-right">
            <Skeleton className="h-12 w-full border border-dashed border-border/80" />
            <Skeleton className="h-4 w-32 ml-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Admin Table Skeleton (for Submissions, Templates, Services)
 */
export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="w-full bg-card border border-border rounded-xl shadow-xs overflow-hidden">
      {/* Table Header */}
      <div className="flex items-center justify-between p-4 bg-muted/40 border-b border-border">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-20" />
        ))}
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center justify-between p-4 gap-4">
            <div className="space-y-1.5 w-1/3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-5 w-20 rounded-md" />
            <Skeleton className="h-5 w-24 rounded-md" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-20 rounded-lg shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
