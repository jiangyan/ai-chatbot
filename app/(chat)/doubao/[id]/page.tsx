import { Suspense } from 'react';
import { DoubaoClient } from './client';

export const experimental_ppr = true;

interface PageProps {
  params: { id: string };
}

// Dynamic chat component that will be loaded after initial HTML
async function ChatContent({ id }: { id: string }) {
  // You can add any async data fetching here
  return <DoubaoClient params={{ id }} />;
}

export default async function Page({ params }: PageProps) {
  return (
    <div className="min-h-screen">
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
        <ChatContent id={params.id} />
      </Suspense>
    </div>
  );
} 