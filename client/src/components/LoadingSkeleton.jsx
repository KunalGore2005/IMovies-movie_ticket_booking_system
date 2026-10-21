import React from 'react';

export const MovieCardSkeleton = () => {
  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm animate-pulse">
      <div className="aspect-[2/3] w-full bg-slate-200 dark:bg-slate-800"></div>
      <div className="p-4 space-y-3">
        <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
        <div className="flex gap-2">
          <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
          <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
        </div>
        <div className="h-9 w-full bg-slate-200 dark:bg-slate-800 rounded-xl mt-2"></div>
      </div>
    </div>
  );
};

export const SeatGridSkeleton = () => {
  return (
    <div className="w-full p-8 rounded-2xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 animate-pulse space-y-6">
      <div className="h-6 w-48 mx-auto bg-slate-200 dark:bg-slate-800 rounded-full"></div>
      <div className="h-1.5 w-3/4 mx-auto bg-slate-300 dark:bg-slate-700 rounded-full"></div>
      <div className="grid grid-cols-8 gap-2.5 max-w-md mx-auto pt-4">
        {Array.from({ length: 32 }).map((_, i) => (
          <div key={i} className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
        ))}
      </div>
    </div>
  );
};

export const TableSkeleton = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse">
      <div className="h-12 bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800"></div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="p-4 flex items-center justify-between gap-4">
            {Array.from({ length: cols }).map((_, c) => (
              <div key={c} className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-1/4"></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
