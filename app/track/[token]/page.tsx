'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import MapComponent from '@/components/Map';
import { GPSPoint } from '@/lib/gps';

export default function LiveTrackingPage() {
  const params = useParams();
  const [tracking, setTracking] = useState<any>(null);
  const [location, setLocation] = useState<GPSPoint | null>(null);

  useEffect(() => {
    loadTracking();
    const interval = setInterval(loadTracking, 5000);
    return () => clearInterval(interval);
  }, [params.token]);

  const loadTracking = async () => {
    const { data } = await supabase
      .from('live_tracking')
      .select('*, profiles:user_id(name)')
      .eq('share_token', params.token)
      .eq('is_active', true)
      .single();

    if (data) {
      setTracking(data);
      if (data.last_location) {
        setLocation({
          lat: data.last_location.coordinates[1],
          lng: data.last_location.coordinates[0],
          timestamp: new Date(data.last_update).getTime(),
        });
      }
    }
  };

  if (!tracking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="text-center bg-white/10 backdrop-blur-lg p-12 border border-white/20">
          <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
            Tracking Not Found
          </h1>
          <p className="text-gray-400">This tracking session may have ended.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="bg-gradient-to-r from-orange-500/20 to-pink-500/20 backdrop-blur-lg border-b-2 border-orange-500/30 p-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
          📍 Tracking {tracking.profiles?.name || 'Cyclist'}
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Last updated: {new Date(tracking.last_update).toLocaleTimeString()}
        </p>
      </div>
      <div className="flex-1 border-4 border-orange-500/20">
        {location && <MapComponent points={[location]} center={[location.lng, location.lat]} />}
      </div>
    </div>
  );
}
