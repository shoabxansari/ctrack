'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import AuthGuard from '@/components/AuthGuard';

interface LeaderboardEntry {
  user_id: string;
  name: string;
  total_distance: number;
  total_rides: number;
  avg_speed: number;
  rank: number;
}

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('week');
  const [category, setCategory] = useState<'distance' | 'rides' | 'speed'>('distance');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    loadLeaderboard();
    getCurrentUser();
  }, [period, category]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      
      if (period === 'week') {
        startDate.setDate(now.getDate() - 7);
      } else if (period === 'month') {
        startDate.setMonth(now.getMonth() - 1);
      } else {
        startDate = new Date('2000-01-01'); // All time
      }

      // Get ALL public rides in period (not just current user's)
      const { data: ridesData, error } = await supabase
        .from('rides')
        .select('user_id, distance, avg_speed, profiles:user_id(name)')
        .eq('is_public', true)
        .gte('start_time', startDate.toISOString())
        .order('start_time', { ascending: false });

      if (error) throw error;

      // Aggregate by user
      const userStats = new Map<string, any>();
      
      ridesData?.forEach((ride: any) => {
        const userId = ride.user_id;
        if (!userStats.has(userId)) {
          userStats.set(userId, {
            user_id: userId,
            name: ride.profiles?.name || 'Unknown',
            total_distance: 0,
            total_rides: 0,
            total_speed: 0,
            max_speed: 0
          });
        }
        
        const stats = userStats.get(userId);
        stats.total_distance += ride.distance || 0;
        stats.total_rides += 1;
        stats.total_speed += ride.avg_speed || 0;
        stats.max_speed = Math.max(stats.max_speed, ride.avg_speed || 0);
      });

      // Convert to array and calculate averages
      let entries: LeaderboardEntry[] = Array.from(userStats.values()).map(stats => ({
        user_id: stats.user_id,
        name: stats.name,
        total_distance: stats.total_distance,
        total_rides: stats.total_rides,
        avg_speed: stats.total_rides > 0 ? stats.total_speed / stats.total_rides : 0,
        rank: 0
      }));

      // Sort based on category
      if (category === 'distance') {
        entries.sort((a, b) => b.total_distance - a.total_distance);
      } else if (category === 'rides') {
        entries.sort((a, b) => b.total_rides - a.total_rides);
      } else {
        entries.sort((a, b) => b.avg_speed - a.avg_speed);
      }

      // Assign ranks
      entries = entries.map((entry, index) => ({ ...entry, rank: index + 1 }));

      setLeaderboard(entries);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <Navbar />
        <div className="max-w-4xl mx-auto p-6">
          <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
            🏆 Leaderboards
          </h1>

          {/* Filters */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Period selector */}
            <div className="bg-white/10 backdrop-blur-lg p-4 border border-white/20">
              <div className="text-gray-400 text-sm mb-2">Time Period</div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPeriod('week')}
                  className={`flex-1 py-2 font-semibold transition-all border-2 ${
                    period === 'week'
                      ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white border-white'
                      : 'bg-white/5 text-gray-400 border-white/20 hover:border-white/40'
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setPeriod('month')}
                  className={`flex-1 py-2 font-semibold transition-all border-2 ${
                    period === 'month'
                      ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white border-white'
                      : 'bg-white/5 text-gray-400 border-white/20 hover:border-white/40'
                  }`}
                >
                  Month
                </button>
                <button
                  onClick={() => setPeriod('all')}
                  className={`flex-1 py-2 font-semibold transition-all border-2 ${
                    period === 'all'
                      ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white border-white'
                      : 'bg-white/5 text-gray-400 border-white/20 hover:border-white/40'
                  }`}
                >
                  All Time
                </button>
              </div>
            </div>

            {/* Category selector */}
            <div className="bg-white/10 backdrop-blur-lg p-4 border border-white/20">
              <div className="text-gray-400 text-sm mb-2">Category</div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCategory('distance')}
                  className={`flex-1 py-2 font-semibold transition-all border-2 ${
                    category === 'distance'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-700 text-white border-white'
                      : 'bg-white/5 text-gray-400 border-white/20 hover:border-white/40'
                  }`}
                >
                  Distance
                </button>
                <button
                  onClick={() => setCategory('rides')}
                  className={`flex-1 py-2 font-semibold transition-all border-2 ${
                    category === 'rides'
                      ? 'bg-gradient-to-r from-green-500 to-green-700 text-white border-white'
                      : 'bg-white/5 text-gray-400 border-white/20 hover:border-white/40'
                  }`}
                >
                  Rides
                </button>
                <button
                  onClick={() => setCategory('speed')}
                  className={`flex-1 py-2 font-semibold transition-all border-2 ${
                    category === 'speed'
                      ? 'bg-gradient-to-r from-purple-500 to-purple-700 text-white border-white'
                      : 'bg-white/5 text-gray-400 border-white/20 hover:border-white/40'
                  }`}
                >
                  Speed
                </button>
              </div>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="space-y-3">
            {leaderboard.map((entry) => (
              <div
                key={entry.user_id}
                className={`bg-white/10 backdrop-blur-lg p-5 border-2 transition-all ${
                  entry.user_id === currentUserId
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-white/20 hover:border-white/40'
                } ${entry.rank <= 3 ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`text-3xl font-black ${
                      entry.rank === 1 ? 'text-yellow-400' :
                      entry.rank === 2 ? 'text-gray-300' :
                      entry.rank === 3 ? 'text-orange-400' :
                      'text-gray-500'
                    }`}>
                      {getMedalEmoji(entry.rank)}
                    </div>
                    <div>
                      <div className="text-white font-bold text-lg">
                        {entry.name}
                        {entry.user_id === currentUserId && (
                          <span className="ml-2 text-xs bg-orange-500 text-white px-2 py-1">YOU</span>
                        )}
                      </div>
                      <div className="text-gray-400 text-sm">
                        {entry.total_rides} rides
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold text-2xl">
                      {category === 'distance' && `${entry.total_distance.toFixed(1)} km`}
                      {category === 'rides' && entry.total_rides}
                      {category === 'speed' && `${entry.avg_speed.toFixed(1)} km/h`}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {leaderboard.length === 0 && !loading && (
            <div className="bg-white/10 backdrop-blur-lg p-12 border border-white/20 text-center">
              <div className="text-6xl mb-4">🏆</div>
              <h2 className="text-2xl font-bold text-white mb-2">No Data Yet</h2>
              <p className="text-gray-400">
                Complete some rides to appear on the leaderboard!
              </p>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
