'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import AuthGuard from '@/components/AuthGuard';

export default function SocialPage() {
  const [publicRides, setPublicRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPublicRides();
  }, []);

  const loadPublicRides = async () => {
    try {
      const { data, error } = await supabase
        .from('rides')
        .select(`
          *,
          profiles:user_id (name, avatar_url)
        `)
        .eq('is_public', true)
        .order('start_time', { ascending: false })
        .limit(20);

      if (error) throw error;
      setPublicRides(data || []);
    } catch (error) {
      console.error('Error loading public rides:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return <div className="p-8">Loading feed...</div>;
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Navbar />
        <div className="max-w-4xl mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-5xl font-black text-gray-900 mb-2">Community</h1>
            <p className="text-gray-600 text-lg">See what other cyclists are up to</p>
          </div>

          {publicRides.length === 0 ? (
            <div className="text-center py-20 bg-white border border-gray-200">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No public rides yet</h3>
              <p className="text-gray-600 mb-6">Be the first to share your ride with the community!</p>
              <a
                href="/"
                className="inline-block px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold hover:shadow-lg transition-all"
              >
                Start Riding
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {publicRides.map((ride) => (
                <div key={ride.id} className="bg-white p-6 border border-gray-200 hover:shadow-md transition-all group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white text-xl font-black">
                        {ride.profiles?.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{ride.profiles?.name || 'Anonymous'}</div>
                        <div className="text-sm text-gray-500">{formatDate(ride.start_time)}</div>
                      </div>
                    </div>
                    <a
                      href={`/ride/${ride.id}`}
                      className="text-orange-500 hover:text-orange-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      View Details →
                    </a>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 border border-blue-200">
                      <div className="text-xs text-blue-600 font-medium mb-1">Distance</div>
                      <div className="text-2xl font-black text-blue-900">{ride.distance.toFixed(2)} <span className="text-sm">km</span></div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 border border-green-200">
                      <div className="text-xs text-green-600 font-medium mb-1">Avg Speed</div>
                      <div className="text-2xl font-black text-green-900">{ride.avg_speed.toFixed(1)} <span className="text-sm">km/h</span></div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 border border-purple-200">
                      <div className="text-xs text-purple-600 font-medium mb-1">Max Speed</div>
                      <div className="text-2xl font-black text-purple-900">{ride.max_speed.toFixed(1)} <span className="text-sm">km/h</span></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
