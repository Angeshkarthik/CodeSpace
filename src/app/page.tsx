'use client';

import dynamic from 'next/dynamic';

const WorkspaceContainer = dynamic(
  () => import('@/components/workspace/WorkspaceContainer').then((mod) => mod.WorkspaceContainer),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center h-screen w-screen bg-canvas text-secondary font-mono text-xs space-y-3">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-secondary font-semibold text-sm">Initializing CodeSpace...</p>
        <span className="text-[11px] text-muted">Loading Monaco Editor & IndexedDB</span>
      </div>
    ),
  }
);

export default function Home() {
  return <WorkspaceContainer />;
}
