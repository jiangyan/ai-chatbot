import type { Metadata } from 'next';
import { Toaster } from 'sonner';

import { ThemeProvider } from '@/components/theme-provider';

import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://chat.vercel.ai'),
  title: '上汽通用五菱索赔AI Demo展示',
  description: '上汽通用五菱索赔AI Demo展示',
};

export const viewport = {
  maximumScale: 1, // Disable auto-zoom on mobile Safari
};

interface RootLayoutProps {
  children: React.ReactNode;
  params?: Promise<{ [key: string]: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function RootLayout({
  children,
  params,
  searchParams,
}: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Toaster position="top-center" />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
