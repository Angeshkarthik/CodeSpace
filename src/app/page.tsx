'use client';

import dynamic from 'next/dynamic';

const WorkspaceContainer = dynamic(
  () => import('@/components/workspace/WorkspaceContainer').then((mod) => mod.WorkspaceContainer),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center h-screen w-screen bg-[#0d1117] text-gray-400 font-mono text-xs space-y-3">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-300 font-semibold text-sm">Initializing CodeSpace...</p>
        <span className="text-[11px] text-gray-500">Loading Monaco Editor & IndexedDB</span>
      </div>
    ),
  }
);

export default function Home() {
  return <WorkspaceContainer />;
}
