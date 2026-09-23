'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import AuthGuard from '@/components/AuthGuard';

interface Challenge {
  id: string;
  title: string;
  description: string;
  challenge_type: string;
  target_value: number;
  start_date: string;
  end_date: string;
  participants_count: number;
  user_progress?: number;
  user_joined?: boolean;
  completed?: boolean;
}

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    loadChallenges();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  const loadChallenges = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all active challenges
      const { data: challengesData, error } = await supabase
        .from('challenges')
        .select('*')
        .gte('end_date', new Date().toISOString())
        .order('start_date', { ascending: false });

      if (error) throw error;

      // Get participant counts and user progress
      const challengesWithData = await Promise.all(
        (challengesData || []).map(async (challenge) => {
          const [participantsResult, userProgressResult] = await Promise.all([
            supabase.from('challenge_participants').select('id', { count: 'exact' }).eq('challenge_id', challenge.id),
            supabase.from('challenge_participants').select('*').eq('challenge_id', challenge.id).eq('user_id', user.id).single()
          ]);

          return {
            ...challenge,
            participants_count: participantsResult.count || 0,
            user_progress: userProgressResult.data?.current_progress || 0,
            user_joined: !!userProgressResult.data,
            completed: userProgressResult.data?.completed || false
          };
        })
      );

      setChallenges(challengesWithData);
    } catch (error) {
      console.error('Error loading challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const joinChallenge = async (challengeId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('challenge_participants').insert({
        challenge_id: challengeId,
        user_id: user.id
      });

      loadChallenges();
    } catch (error) {
      console.error('Error joining challenge:', error);
    }
  };

  const shareChallenge = async (challenge: Challenge) => {
    const shareText = `🎉 I completed the "${challenge.title}" challenge on Zyclist!\n\n✅ Target: ${challenge.target_value}${
      challenge.challenge_type === 'distance' ? ' km' :
      challenge.challenge_type === 'rides' ? ' rides' :
      ' km/h'
    }\n💪 My Progress: ${challenge.user_progress?.toFixed(1)}\n\nJoin me on Zyclist!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Challenge Completed!',
          text: shareText,
          url: window.location.href
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(shareText);
      alert('Achievement copied to clipboard! Share it with your friends!');
    }
  };

  const getChallengeIcon = (type: string) => {
    switch (type) {
      case 'distance': return '📏';
      case 'rides': return '🚴';
      case 'speed': return '⚡';
      case 'segment': return '🎯';
      default: return '🏆';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <Navbar />
        <div className="max-w-6xl mx-auto p-6">
          <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
            🎯 Challenges
          </h1>

          <div className="grid md:grid-cols-2 gap-6">
            {challenges.map((challenge) => {
              const progress = challenge.user_joined 
                ? (challenge.user_progress! / challenge.target_value) * 100 
                : 0;
              const daysLeft = getDaysRemaining(challenge.end_date);

              return (
                <div
                  key={challenge.id}
                  className={`bg-white/10 backdrop-blur-lg p-6 border-2 transition-all ${
                    challenge.completed
                      ? 'border-green-500 bg-green-500/10'
                      : challenge.user_joined
                      ? 'border-orange-500 bg-orange-500/5'
                      : 'border-white/20 hover:border-white/40'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-4xl">{getChallengeIcon(challenge.challenge_type)}</div>
                      <div>
                        <h3 className="text-white font-bold text-xl">{challenge.title}</h3>
                        <p className="text-gray-400 text-sm">{challenge.description}</p>
                      </div>
                    </div>
                    {challenge.completed && (
                      <div className="bg-green-500 text-white px-3 py-1 text-xs font-bold">
                        ✓ COMPLETED
                      </div>
                    )}
                  </div>

                  {/* Target */}
                  <div className="bg-black/30 p-4 mb-4 border border-white/10">
                    <div className="text-gray-400 text-sm mb-1">Target</div>
                    <div className="text-white font-bold text-2xl">
                      {challenge.target_value}
                      {challenge.challenge_type === 'distance' && ' km'}
                      {challenge.challenge_type === 'rides' && ' rides'}
                      {challenge.challenge_type === 'speed' && ' km/h'}
                    </div>
                  </div>

                  {/* Progress */}
                  {challenge.user_joined && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">Your Progress</span>
                        <span className="text-white font-semibold">
                          {challenge.user_progress?.toFixed(1)} / {challenge.target_value}
                        </span>
                      </div>
                      <div className="h-3 bg-black/30 border border-white/10 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-500 to-pink-500 transition-all"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex items-center justify-between text-sm mb-4">
                    <div className="text-gray-400">
                      {formatDate(challenge.start_date)} - {formatDate(challenge.end_date)}
                    </div>
                    <div className={`font-semibold ${daysLeft <= 3 ? 'text-red-400' : 'text-gray-400'}`}>
                      {daysLeft} days left
                    </div>
                  </div>

                  {/* Participants */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="text-gray-400 text-sm">
                      👥 {challenge.participants_count} participants
                    </div>
                    <div className="flex gap-2">
                      {challenge.completed && (
                        <button
                          onClick={() => shareChallenge(challenge)}
                          className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-700 text-white font-semibold hover:shadow-lg transition-all border-2 border-white"
                        >
                          🎉 Share Achievement
                        </button>
                      )}
                      {!challenge.user_joined ? (
                        <button
                          onClick={() => joinChallenge(challenge.id)}
                          className="px-6 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold hover:shadow-lg transition-all border-2 border-white"
                        >
                          Join Challenge
                        </button>
                      ) : (
                        <div className="text-orange-400 font-semibold">
                          ✓ Joined
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {challenges.length === 0 && !loading && (
            <div className="bg-white/10 backdrop-blur-lg p-12 border border-white/20 text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h2 className="text-2xl font-bold text-white mb-2">No Active Challenges</h2>
              <p className="text-gray-400">
                Check back soon for new challenges!
              </p>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
