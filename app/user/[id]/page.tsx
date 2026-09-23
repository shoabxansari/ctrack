'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import AuthGuard from '@/components/AuthGuard';
import Link from 'next/link';

export default function UserProfilePage() {
  const params = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [rides, setRides] = useState<any[]>([]);
  const [stats, setStats] = useState({ followers: 0, following: 0, rides: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
    getCurrentUser();
  }, [params.id]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', params.id)
        .single();

      setProfile(profileData);

      // Get public rides
      const { data: ridesData } = await supabase
        .from('rides')
        .select('*')
        .eq('user_id', params.id)
        .eq('is_public', true)
        .order('start_time', { ascending: false })
        .limit(10);

      setRides(ridesData || []);

      // Get stats
      const [followersResult, followingResult, ridesCount] = await Promise.all([
        supabase.from('followers').select('id', { count: 'exact' }).eq('following_id', params.id),
        supabase.from('followers').select('id', { count: 'exact' }).eq('follower_id', params.id),
        supabase.from('rides').select('id', { count: 'exact' }).eq('user_id', params.id).eq('is_public', true)
      ]);

      setStats({
        followers: followersResult.count || 0,
        following: followingResult.count || 0,
        rides: ridesCount.count || 0
      });

      // Check if current user follows this profile
      const { data: followData } = await supabase
        .from('followers')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', params.id)
        .single();

      setIsFollowing(!!followData);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (isFollowing) {
        // Unfollow
        await supabase
          .from('followers')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', params.id);
      } else {
        // Follow
        await supabase.from('followers').insert({
          follower_id: user.id,
          following_id: params.id
        });
      }

      setIsFollowing(!isFollowing);
      loadProfile(); // Reload to update counts
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
          <Navbar />
          <div className="flex items-center justify-center h-96">
            <div className="text-white text-xl">Loading profile...</div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (!profile) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
          <Navbar />
          <div className="flex items-center justify-center h-96">
            <div className="text-white text-xl">Profile not found</div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  const isOwnProfile = currentUserId === params.id;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <Navbar />
        <div className="max-w-4xl mx-auto p-6">
          {/* Profile Header */}
          <div className="bg-white/10 backdrop-blur-lg p-8 border border-white/20 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold text-4xl">
                  {profile.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">{profile.name || 'Unknown User'}</h1>
                  {profile.bio && <p className="text-gray-400">{profile.bio}</p>}
                </div>
              </div>
              {!isOwnProfile && (
                <button
                  onClick={handleFollow}
                  className={`px-6 py-3 font-semibold transition-all border-2 border-white ${
                    isFollowing
                      ? 'bg-white/10 text-white hover:bg-white/20'
                      : 'bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:shadow-lg'
                  }`}
                >
                  {isFollowing ? '✓ Following' : '+ Follow'}
                </button>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-black/30 p-4 border border-white/10 text-center">
                <div className="text-3xl font-bold text-white">{stats.rides}</div>
                <div className="text-gray-400 text-sm">Rides</div>
              </div>
              <div className="bg-black/30 p-4 border border-white/10 text-center">
                <div className="text-3xl font-bold text-white">{stats.followers}</div>
                <div className="text-gray-400 text-sm">Followers</div>
              </div>
              <div className="bg-black/30 p-4 border border-white/10 text-center">
                <div className="text-3xl font-bold text-white">{stats.following}</div>
                <div className="text-gray-400 text-sm">Following</div>
              </div>
            </div>
          </div>

          {/* Recent Rides */}
          <h2 className="text-2xl font-bold text-white mb-4">Recent Rides</h2>
          <div className="space-y-4">
            {rides.map((ride) => (
              <Link key={ride.id} href={`/ride/${ride.id}`}>
                <div className="bg-white/10 backdrop-blur-lg p-6 border border-white/20 hover:border-orange-500/50 transition-all cursor-pointer">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-white font-bold text-lg">{ride.title || '🚴 Ride'}</h3>
                      <p className="text-gray-400 text-sm">
                        {new Date(ride.start_time).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-gray-400 text-sm">Distance</div>
                      <div className="text-white font-semibold">{ride.distance.toFixed(2)} km</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm">Avg Speed</div>
                      <div className="text-white font-semibold">{ride.avg_speed.toFixed(1)} km/h</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm">Max Speed</div>
                      <div className="text-white font-semibold">{ride.max_speed.toFixed(1)} km/h</div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {rides.length === 0 && (
            <div className="bg-white/10 backdrop-blur-lg p-12 border border-white/20 text-center">
              <div className="text-6xl mb-4">🚴</div>
              <h3 className="text-2xl font-bold text-white mb-2">No Public Rides</h3>
              <p className="text-gray-400">This user hasn't shared any rides yet.</p>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
