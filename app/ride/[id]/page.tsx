'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import MapComponent from '@/components/Map';
import { GPSPoint } from '@/lib/gps';
import Navbar from '@/components/Navbar';
import AuthGuard from '@/components/AuthGuard';

export default function RideDetailPage() {
  const params = useParams();
  const [ride, setRide] = useState<any>(null);
  const [points, setPoints] = useState<GPSPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRide();
  }, [params.id]);

  const loadRide = async () => {
    try {
      const { data: rideData, error: rideError } = await supabase
        .from('rides')
        .select('*')
        .eq('id', params.id)
        .single();

      if (rideError) throw rideError;
      setRide(rideData);

      // Load ride points
      const { data: pointsData, error: pointsError } = await supabase
        .from('ride_points')
        .select('*')
        .eq('ride_id', params.id)
        .order('timestamp', { ascending: true });

      if (pointsError) {
        console.error('Error loading points:', pointsError);
      }

      if (pointsData && pointsData.length > 0) {
        const gpsPoints: GPSPoint[] = pointsData.map((p: any) => {
          // Handle both POINT format and coordinates array
          let lat, lng;
          if (p.location.coordinates) {
            lng = p.location.coordinates[0];
            lat = p.location.coordinates[1];
          } else if (typeof p.location === 'string') {
            // Parse "POINT(lng lat)" format
            const match = p.location.match(/POINT\(([^ ]+) ([^ ]+)\)/);
            if (match) {
              lng = parseFloat(match[1]);
              lat = parseFloat(match[2]);
            }
          }

          return {
            lat: lat || 0,
            lng: lng || 0,
            timestamp: new Date(p.timestamp).getTime(),
            speed: p.speed,
            altitude: p.altitude,
          };
        });

        setPoints(gpsPoints);
      }
    } catch (error) {
      console.error('Error loading ride:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (start: string, end?: string) => {
    if (!end) return 'In progress';
    const duration = new Date(end).getTime() - new Date(start).getTime();
    const hours = Math.floor(duration / 3600000);
    const minutes = Math.floor((duration % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return <div className="p-8">Loading ride...</div>;
  }

  if (!ride) {
    return <div className="p-8">Ride not found</div>;
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <Navbar />
        <div className="bg-gradient-to-r from-orange-500/20 to-pink-500/20 backdrop-blur-lg border-b border-white/10">
          <div className="max-w-6xl mx-auto p-6">
            <div className="mb-6">
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
                {ride.title || 'Ride Details'}
              </h1>
              <p className="text-gray-400">{formatDate(ride.start_time)}</p>
            </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-5 border border-blue-400/30">
              <div className="text-sm text-blue-200">Distance</div>
              <div className="text-3xl font-bold text-white">{ride.distance.toFixed(2)} km</div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-700 p-5 border border-green-400/30">
              <div className="text-sm text-green-200">Duration</div>
              <div className="text-3xl font-bold text-white">
                {formatDuration(ride.start_time, ride.end_time)}
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-700 p-5 border border-purple-400/30">
              <div className="text-sm text-purple-200">Avg Speed</div>
              <div className="text-3xl font-bold text-white">{ride.avg_speed.toFixed(1)} km/h</div>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-pink-500 p-5 border border-orange-400/30">
              <div className="text-sm text-orange-200">Max Speed</div>
              <div className="text-3xl font-bold text-white">{ride.max_speed.toFixed(1)} km/h</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 overflow-hidden" style={{ height: '500px' }}>
          <MapComponent points={points} />
        </div>
      </div>
    </div>
    </AuthGuard>
  );
}
