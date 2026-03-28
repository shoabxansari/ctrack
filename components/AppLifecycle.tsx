'use client';

import { useEffect } from 'react';
import { useRideStore } from '@/store/rideStore';

export default function AppLifecycle() {
  const { isTracking } = useRideStore();

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('App became visible - ride data should persist');
      } else {
        console.log('App hidden - ride data saved to localStorage');
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isTracking) {
        e.preventDefault();
        e.returnValue = 'You have an active ride. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isTracking]);

  return null;
}
