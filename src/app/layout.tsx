
import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/layout/app-shell';
import { Toaster } from "@/components/ui/toaster";
import { DataProvider } from '@/context/data-context';

export const metadata: Metadata = {
  title: 'Technofiable Engineering LLP.',
  description: 'Shutdown and Turnaround Management Software',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400..700&family=Space+Grotesk:wght@400..700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <DataProvider>
          <AppShell>
            {children}
          </AppShell>
        </DataProvider>
        <Toaster />
      </body>
    </html>
  );
}
