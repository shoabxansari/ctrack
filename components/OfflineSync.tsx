'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { offlineStorage } from '@/lib/offlineStorage';

export default function OfflineSync() {
  const [syncing, setSyncing] = useState(false);
  const [unsyncedCount, setUnsyncedCount] = useState(0);

  useEffect(() => {
    checkUnsyncedRides();
    const interval = setInterval(checkUnsyncedRides, 5000);
    return () => clearInterval(interval);
  }, []);

  const checkUnsyncedRides = () => {
    const unsynced = offlineStorage.getUnsyncedRides();
    setUnsyncedCount(unsynced.length);
  };

  const syncRides = async () => {
    setSyncing(true);
    const unsynced = offlineStorage.getUnsyncedRides();

    for (const ride of unsynced) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) continue;

        const distance = calculateDistance(ride.points);
        const duration = (ride.endTime || Date.now()) - ride.startTime;
        const avgSpeed = (distance / (duration / 1000 / 3600)) || 0;

        await supabase.from('rides').insert({
          user_id: user.id,
          start_time: new Date(ride.startTime).toISOString(),
          end_time: ride.endTime ? new Date(ride.endTime).toISOString() : null,
          distance,
          avg_speed: avgSpeed,
          max_speed: Math.max(...ride.points.map(p => (p.speed || 0) * 3.6)),
        });

        offlineStorage.markAsSynced(ride.id);
      } catch (error) {
        console.error('Sync error:', error);
      }
    }

    setSyncing(false);
    checkUnsyncedRides();
  };

  const calculateDistance = (points: any[]) => {
    let total = 0;
    for (let i = 1; i < points.length; i++) {
      const R = 6371;
      const dLat = ((points[i].lat - points[i - 1].lat) * Math.PI) / 180;
      const dLon = ((points[i].lng - points[i - 1].lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((points[i - 1].lat * Math.PI) / 180) *
          Math.cos((points[i].lat * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      total += R * c;
    }
    return total;
  };

  if (unsyncedCount === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-500 text-white p-4 rounded-lg shadow-lg">
      <div className="flex items-center gap-3">
        <div>
          <div className="font-semibold">{unsyncedCount} unsynced ride(s)</div>
          <div className="text-sm">Waiting to upload</div>
        </div>
        <button
          onClick={syncRides}
          disabled={syncing}
          className="bg-white text-yellow-600 px-4 py-2 rounded font-semibold disabled:opacity-50"
        >
          {syncing ? 'Syncing...' : 'Sync Now'}
        </button>
      </div>
    </div>
  );
}
