'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import AuthGuard from '@/components/AuthGuard';
import Link from 'next/link';

interface FeedPost {
  id: string;
  user_id: string;
  ride_id: string;
  content: string;
  created_at: string;
  profiles: {
    name: string;
  };
  rides: {
    distance: number;
    avg_speed: number;
    start_time: string;
    title: string;
  };
  likes_count: number;
  comments_count: number;
  user_liked: boolean;
}

export default function FeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    loadFeed();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  const loadFeed = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get posts from followed users and own posts
      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id(name),
          rides:ride_id(distance, avg_speed, start_time, title)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Get likes and comments count for each post
      const postsWithCounts = await Promise.all(
        (postsData || []).map(async (post) => {
          const [likesResult, commentsResult, userLikeResult] = await Promise.all([
            supabase.from('likes').select('id', { count: 'exact' }).eq('post_id', post.id),
            supabase.from('comments').select('id', { count: 'exact' }).eq('post_id', post.id),
            supabase.from('likes').select('id').eq('post_id', post.id).eq('user_id', user.id).single()
          ]);

          return {
            ...post,
            likes_count: likesResult.count || 0,
            comments_count: commentsResult.count || 0,
            user_liked: !!userLikeResult.data
          };
        })
      );

      setPosts(postsWithCounts);
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      if (post.user_liked) {
        // Unlike
        await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', currentUserId);
      } else {
        // Like
        await supabase.from('likes').insert({ post_id: postId, user_id: currentUserId });
      }

      // Reload feed
      loadFeed();
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
          <Navbar />
          <div className="flex items-center justify-center h-96">
            <div className="text-white text-xl">Loading feed...</div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <Navbar />
        <div className="max-w-2xl mx-auto p-6">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
              Activity Feed
            </h1>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold hover:shadow-lg transition-all border-2 border-white"
            >
              Share Ride
            </Link>
          </div>

          {posts.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-lg p-12 border border-white/20 text-center">
              <div className="text-6xl mb-4">🚴</div>
              <h2 className="text-2xl font-bold text-white mb-2">No Activity Yet</h2>
              <p className="text-gray-400 mb-6">
                Start following cyclists or share your first ride!
              </p>
              <Link
                href="/social"
                className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold hover:shadow-lg transition-all"
              >
                Find Cyclists
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white/10 backdrop-blur-lg p-6 border border-white/20 hover:border-orange-500/50 transition-all"
                >
                  {/* User info */}
                  <Link href={`/user/${post.user_id}`}>
                    <div className="flex items-center mb-4 cursor-pointer hover:opacity-80 transition-opacity">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl mr-3">
                        {post.profiles?.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div className="text-white font-semibold">{post.profiles?.name || 'Unknown'}</div>
                        <div className="text-gray-400 text-sm">{formatDate(post.created_at)}</div>
                      </div>
                    </div>
                  </Link>

                  {/* Ride info */}
                  <Link href={`/ride/${post.ride_id}`}>
                    <div className="bg-black/30 p-4 mb-4 border border-white/10 hover:border-orange-500/50 transition-all cursor-pointer">
                      <h3 className="text-white font-bold text-lg mb-2">
                        {post.rides?.title || '🚴 Ride Activity'}
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-gray-400">Distance</div>
                          <div className="text-white font-semibold">{post.rides?.distance?.toFixed(2)} km</div>
                        </div>
                        <div>
                          <div className="text-gray-400">Avg Speed</div>
                          <div className="text-white font-semibold">{post.rides?.avg_speed?.toFixed(1)} km/h</div>
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Post content */}
                  {post.content && (
                    <p className="text-gray-300 mb-4">{post.content}</p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-6 pt-4 border-t border-white/10">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-2 transition-all ${
                        post.user_liked ? 'text-pink-500' : 'text-gray-400 hover:text-pink-500'
                      }`}
                    >
                      <span className="text-xl">{post.user_liked ? '❤️' : '🤍'}</span>
                      <span className="font-semibold">{post.likes_count}</span>
                    </button>
                    <Link
                      href={`/post/${post.id}`}
                      className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-all"
                    >
                      <span className="text-xl">💬</span>
                      <span className="font-semibold">{post.comments_count}</span>
                    </Link>
                    <button className="flex items-center gap-2 text-gray-400 hover:text-green-400 transition-all">
                      <span className="text-xl">🔗</span>
                      <span className="font-semibold">Share</span>
                    </button>
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
