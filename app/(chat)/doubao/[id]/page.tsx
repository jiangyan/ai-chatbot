import { Suspense } from 'react';
import { DoubaoClient } from './client';

export const experimental_ppr = true;

interface DoubaoProps {
  params: {
    id: string;
  };
}

// Dynamic chat component that will be loaded after initial HTML
function ChatContent({ params }: DoubaoProps) {
  return <DoubaoClient params={params} />;
}

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function Page({ params }: PageProps) {
  const resolvedParams = await params;
  
  return (
    <div className="min-h-screen">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-pulse text-lg">Loading chat...</div>
        </div>
      }>
        <ChatContent params={resolvedParams} />
      </Suspense>
    </div>
  );
} 