'use client';

import { useEffect, useState } from 'react';
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('installPromptDismissed', 'true');
  };

  if (!showPrompt || localStorage.getItem('installPromptDismissed')) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-4 right-4 z-50 animate-slide-up md:left-auto md:right-6 md:w-96">
      <Alert className="bg-gradient-to-br from-orange-500 to-pink-500 border-2 border-orange-400 text-white shadow-2xl backdrop-blur-lg">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="size-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
          />
        </svg>
        <AlertTitle className="text-white font-bold text-base">
          Install Zyclist App
        </AlertTitle>
        <AlertDescription className="text-white/90 text-sm">
          Get offline access, faster performance, and a native app experience!
        </AlertDescription>
        <AlertAction>
          <button
            onClick={handleDismiss}
            className="text-white/80 hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="size-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </AlertAction>
        <div className="col-start-2 mt-3 flex gap-2">
          <button
            onClick={handleInstall}
            className="bg-white text-orange-600 px-4 py-2 font-bold text-sm hover:bg-gray-100 transition-all transform hover:scale-105 border-2 border-white"
          >
            Install Now
          </button>
          <button
            onClick={handleDismiss}
            className="bg-white/20 text-white px-4 py-2 text-sm hover:bg-white/30 transition-all border-2 border-white/30"
          >
            Maybe Later
          </button>
        </div>
      </Alert>
    </div>
  );
}
