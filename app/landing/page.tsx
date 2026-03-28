'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      router.push('/');
    } else {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-black" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-orange-500 rounded-full mix-blend-multiply filter blur-xl animate-blob" />
          <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000" />
        </div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 mb-8">
              <span className="text-2xl">🚴</span>
              <span className="text-white font-semibold">Zyclist</span>
            </div>

            <h1 className="text-6xl md:text-8xl font-black text-white mb-6 tracking-tight">
              Track Every
              <span className="block bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                Pedal
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto">
              Join thousands of cyclists tracking their rides, competing with friends, and pushing their limits.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/"
                className="px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all"
              >
                Start Riding Free
              </a>
              <a
                href="#features"
                className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-bold text-lg hover:bg-white/20 transition-all"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            Everything You Need
          </h2>
          <p className="text-xl text-gray-400">
            Professional cycling tools, completely free
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white/5 backdrop-blur-sm p-8 border border-white/10 hover:bg-white/10 transition-all">
            <div className="text-4xl mb-4">📍</div>
            <h3 className="text-2xl font-bold text-white mb-3">GPS Tracking</h3>
            <p className="text-gray-400">
              Real-time route tracking with detailed stats on distance, speed, and elevation.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm p-8 border border-white/10 hover:bg-white/10 transition-all">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-2xl font-bold text-white mb-3">Analytics</h3>
            <p className="text-gray-400">
              Deep insights into your performance with AI-powered recommendations.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm p-8 border border-white/10 hover:bg-white/10 transition-all">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-2xl font-bold text-white mb-3">Social</h3>
            <p className="text-gray-400">
              Share rides, compete on leaderboards, and connect with cyclists worldwide.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-5xl font-black text-white mb-2">10K+</div>
            <div className="text-gray-400">Active Riders</div>
          </div>
          <div>
            <div className="text-5xl font-black text-white mb-2">1M+</div>
            <div className="text-gray-400">Rides Tracked</div>
          </div>
          <div>
            <div className="text-5xl font-black text-white mb-2">50M+</div>
            <div className="text-gray-400">KM Logged</div>
          </div>
          <div>
            <div className="text-5xl font-black text-white mb-2">100%</div>
            <div className="text-gray-400">Free Forever</div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
          Ready to ride?
        </h2>
        <p className="text-xl text-gray-400 mb-8">
          Join the community and start tracking your rides today.
        </p>
        <a
          href="/"
          className="inline-block px-12 py-5 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold text-xl hover:shadow-2xl hover:scale-105 transition-all"
        >
          Get Started
        </a>
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500">
          <p>© 2024 Zyclist. Built for cyclists, by cyclists.</p>
        </div>
      </div>
    </div>
  );
}
