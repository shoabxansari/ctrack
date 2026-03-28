'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import AuthGuard from '@/components/AuthGuard';

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: rides } = await supabase
        .from('rides')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false });

      if (!rides) return;

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const weekRides = rides.filter(r => new Date(r.start_time) >= weekAgo);
      const monthRides = rides.filter(r => new Date(r.start_time) >= monthAgo);

      setStats({
        total: {
          rides: rides.length,
          distance: rides.reduce((sum, r) => sum + r.distance, 0),
          avgSpeed: rides.length > 0 
            ? rides.reduce((sum, r) => sum + r.avg_speed, 0) / rides.length 
            : 0,
        },
        week: {
          rides: weekRides.length,
          distance: weekRides.reduce((sum, r) => sum + r.distance, 0),
        },
        month: {
          rides: monthRides.length,
          distance: monthRides.reduce((sum, r) => sum + r.distance, 0),
        },
        longest: rides.length > 0 
          ? Math.max(...rides.map(r => r.distance)) 
          : 0,
        fastest: rides.length > 0 
          ? Math.max(...rides.map(r => r.max_speed)) 
          : 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading analytics...</div>;
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Navbar />
        <div className="max-w-7xl mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-5xl font-black text-gray-900 mb-2">Analytics</h1>
            <p className="text-gray-600 text-lg">Track your progress and performance</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* All Time Stats */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-8 border border-blue-400 text-white">
              <h3 className="text-lg font-bold mb-6 opacity-90">All Time</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm opacity-80 mb-1">Total Rides</div>
                  <div className="text-4xl font-black">{stats?.total.rides || 0}</div>
                </div>
                <div>
                  <div className="text-sm opacity-80 mb-1">Total Distance</div>
                  <div className="text-4xl font-black">{stats?.total.distance.toFixed(1) || 0} <span className="text-xl">km</span></div>
                </div>
                <div>
                  <div className="text-sm opacity-80 mb-1">Avg Speed</div>
                  <div className="text-4xl font-black">{stats?.total.avgSpeed.toFixed(1) || 0} <span className="text-xl">km/h</span></div>
                </div>
              </div>
            </div>

            {/* This Week */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-8 border border-green-400 text-white">
              <h3 className="text-lg font-bold mb-6 opacity-90">This Week</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm opacity-80 mb-1">Rides</div>
                  <div className="text-4xl font-black">{stats?.week.rides || 0}</div>
                </div>
                <div>
                  <div className="text-sm opacity-80 mb-1">Distance</div>
                  <div className="text-4xl font-black">{stats?.week.distance.toFixed(1) || 0} <span className="text-xl">km</span></div>
                </div>
              </div>
            </div>

            {/* This Month */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-8 border border-purple-400 text-white">
              <h3 className="text-lg font-bold mb-6 opacity-90">This Month</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm opacity-80 mb-1">Rides</div>
                  <div className="text-4xl font-black">{stats?.month.rides || 0}</div>
                </div>
                <div>
                  <div className="text-sm opacity-80 mb-1">Distance</div>
                  <div className="text-4xl font-black">{stats?.month.distance.toFixed(1) || 0} <span className="text-xl">km</span></div>
                </div>
              </div>
            </div>

            {/* Records */}
            <div className="bg-gradient-to-br from-orange-500 to-pink-500 p-8 border border-orange-400 text-white md:col-span-2">
              <h3 className="text-lg font-bold mb-6 opacity-90">🏆 Personal Records</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-sm opacity-80 mb-1">Longest Ride</div>
                  <div className="text-5xl font-black">{stats?.longest.toFixed(1) || 0} <span className="text-2xl">km</span></div>
                </div>
                <div>
                  <div className="text-sm opacity-80 mb-1">Fastest Speed</div>
                  <div className="text-5xl font-black">{stats?.fastest.toFixed(1) || 0} <span className="text-2xl">km/h</span></div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-8 border border-gray-200">
              <h3 className="text-lg font-bold mb-4 text-gray-900">Quick Actions</h3>
              <div className="space-y-3">
                <a href="/" className="block w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-center font-semibold hover:shadow-lg transition-all">
                  Start New Ride
                </a>
                <a href="/dashboard" className="block w-full px-4 py-3 bg-gray-100 text-gray-900 text-center font-semibold hover:bg-gray-200 transition-all">
                  View All Rides
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
