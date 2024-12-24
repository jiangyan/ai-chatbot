'use client';

import Link from 'next/link';
import { Button } from './ui/button';
import { ThemeToggle } from './theme-toggle';

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 lg:px-6">
      <div className="flex items-center gap-2">
        <Link href="/chat/new" className="hover:text-foreground/80">
          Chat
        </Link>
        <Link href="/doubao/new" className="hover:text-foreground/80">
          Doubao Chat
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  );
} 