import type { Metadata } from 'next';
import './globals.css';
import OfflineSync from '@/components/OfflineSync';
import InstallPrompt from '@/components/InstallPrompt';
import RideRecovery from '@/components/RideRecovery';
import AppLifecycle from '@/components/AppLifecycle';
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'Zyclist - Ride Tracking App v2.0',
  description: 'Track your rides with AI-powered insights',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Zyclist',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable)}>
      <head>
        <meta name="version" content="2.0" />
        <link rel="manifest" href="/manifest.json?v=2" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <AppLifecycle />
        {children}
        <OfflineSync />
        <InstallPrompt />
        <RideRecovery />
      </body>
    </html>
  );
}
