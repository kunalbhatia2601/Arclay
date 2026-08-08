"use client";

import { motion } from "framer-motion";

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-[var(--c-border)] animate-pulse">
      <div className="relative aspect-[4/5] bg-[var(--c-surface-alt)]/50" />
      <div className="p-4 flex flex-col flex-1 space-y-3">
        <div className="h-5 bg-[var(--c-surface-alt)] rounded-md w-3/4" />
        <div className="h-3 bg-[var(--c-surface-alt)] rounded-md w-1/2" />
        <div className="flex items-center gap-2 mt-auto">
          <div className="h-6 bg-[var(--c-surface-alt)] rounded-md w-20" />
          <div className="h-4 bg-[var(--c-surface-alt)] rounded-md w-12" />
        </div>
      </div>
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--c-bg)] py-12">
      <div className="container mx-auto px-4 xl:px-8 max-w-7xl animate-pulse">
        <div className="grid lg:grid-cols-2 gap-16">
          <div className="aspect-square bg-[var(--c-surface-alt)]/50 rounded-2xl" />
          <div className="space-y-6">
            <div className="h-4 bg-[var(--c-surface-alt)] rounded w-1/4" />
            <div className="h-12 bg-[var(--c-surface-alt)] rounded w-3/4" />
            <div className="h-6 bg-[var(--c-surface-alt)] rounded w-1/2" />
            <div className="h-32 bg-[var(--c-surface-alt)] rounded-2xl" />
            <div className="h-16 bg-[var(--c-surface-alt)] rounded-2xl w-full" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-14 bg-[var(--c-surface-alt)] rounded-xl" />
              <div className="h-14 bg-[var(--c-surface-alt)] rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
