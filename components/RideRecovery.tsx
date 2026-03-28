'use client';

import { useEffect, useState } from 'react';
import { useRideStore } from '@/store/rideStore';

export default function RideRecovery() {
  const { isTracking, currentRide } = useRideStore();
  const [showRecovery, setShowRecovery] = useState(false);

  useEffect(() => {
    // Check if there's an active ride that was interrupted
    if (isTracking && currentRide.startTime && currentRide.points.length > 0) {
      const timeSinceStart = Date.now() - currentRide.startTime;
      // If ride was started more than 1 minute ago and has points, show recovery
      if (timeSinceStart > 60000) {
        setShowRecovery(true);
      }
    }
  }, []);

  if (!showRecovery) return null;

  return (
    <div className="fixed top-20 left-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg z-50">
      <div className="flex items-start gap-3">
        <div className="text-2xl">🔄</div>
        <div className="flex-1">
          <h3 className="font-bold mb-1">Ride Recovered!</h3>
          <p className="text-sm">
            Your ride was automatically saved. Continue tracking or stop to save.
          </p>
          <button
            onClick={() => setShowRecovery(false)}
            className="mt-2 text-sm underline"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
