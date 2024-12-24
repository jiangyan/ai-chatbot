import { Suspense } from 'react';
import { DoubaoClient } from './client';

export const experimental_ppr = true;

interface PageProps {
  params: Promise<{ id: string }>;
}

// Dynamic chat component that will be loaded after initial HTML
async function ChatContent({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <DoubaoClient params={resolvedParams} />;
}

export default function Page({ params }: PageProps) {
  return (
    <div className="min-h-screen">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-pulse text-lg">Loading chat...</div>
        </div>
      }>
        <ChatContent params={params} />
      </Suspense>
    </div>
  );
} 