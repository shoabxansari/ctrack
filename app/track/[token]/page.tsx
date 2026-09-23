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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadTracking();
    const interval = setInterval(loadTracking, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [params.token]);

  const loadTracking = async () => {
    try {
      console.log('Loading tracking for token:', params.token);
      
      // Use the view that has lat/lng already extracted
      const { data, error: fetchError } = await supabase
        .from('live_tracking_view')
        .select('*')
        .eq('share_token', params.token)
        .eq('is_active', true)
        .single();

      if (fetchError) {
        console.error('Error fetching tracking:', fetchError);
        setError('Tracking session not found or has ended');
        setLoading(false);
        return;
      }

      if (data) {
        console.log('Tracking data from view:', data);
        
        // Get profile name separately
        const { data: profileData } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', data.user_id)
          .single();
        
        setTracking({
          ...data,
          profiles: profileData
        });
        
        if (data.lat && data.lng && !isNaN(data.lat) && !isNaN(data.lng)) {
          console.log('✅ Valid location:', { lat: data.lat, lng: data.lng });
          setLocation({
            lat: data.lat,
            lng: data.lng,
            timestamp: new Date(data.last_update).getTime(),
          });
          setError('');
        } else {
          console.log('⏳ No location data yet');
          setError('Waiting for location update...');
        }
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error loading tracking:', err);
      setError('Failed to load tracking data');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="text-center bg-white/10 backdrop-blur-lg p-12 border border-white/20">
          <div className="text-6xl mb-4 animate-pulse">📍</div>
          <h1 className="text-2xl font-bold text-white mb-2">Loading Tracking...</h1>
          <p className="text-gray-400">Please wait</p>
        </div>
      </div>
    );
  }

  if (!tracking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="text-center bg-white/10 backdrop-blur-lg p-12 border border-white/20">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
            Tracking Not Found
          </h1>
          <p className="text-gray-400 mb-4">This tracking session may have ended.</p>
          {error && <p className="text-red-400 text-sm">{error}</p>}
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
        <div className="flex items-center gap-4 mt-2">
          <p className="text-sm text-gray-400">
            Last updated: {new Date(tracking.last_update).toLocaleTimeString()}
          </p>
          {location && (
            <a
              href={`https://maps.google.com/?q=${location.lat},${location.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 transition-all"
            >
              Open in Google Maps
            </a>
          )}
        </div>
      </div>
      
      <div className="flex-1 relative">
        {location ? (
          <MapComponent points={[location]} center={[location.lng, location.lat]} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center bg-white/10 backdrop-blur-lg p-8 border border-white/20">
              <div className="text-6xl mb-4 animate-pulse">📡</div>
              <h2 className="text-2xl font-bold text-white mb-2">Waiting for Location</h2>
              <p className="text-gray-400">The cyclist hasn't shared their location yet.</p>
              {error && <p className="text-orange-400 text-sm mt-2">{error}</p>}
            </div>
          </div>
        )}
      </div>
      
      {/* Auto-refresh indicator */}
      <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-lg px-4 py-2 border border-white/20 text-white text-sm">
        🔄 Auto-updating every 5 seconds
      </div>
    </div>
  );
}
