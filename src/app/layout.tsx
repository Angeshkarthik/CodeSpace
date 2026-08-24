import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CodeSpace — Developer Workspace & Coding Environment',
  description: 'Clean, professional, offline-capable multi-language coding workspace for software practice and DSA problem solving.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-[#0d1117] text-[#e6edf3] selection:bg-emerald-500/30 selection:text-emerald-200" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
