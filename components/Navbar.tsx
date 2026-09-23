'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface NavbarProps {
  showNav?: boolean;
}

export default function Navbar({ showNav = true }: NavbarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
    }
    window.location.href = '/';
  };

  if (!showNav) return null;

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <a href="/" className="flex items-center gap-2">
              <span className="text-2xl">🚴</span>
              <span className="text-xl font-black bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                Zyclist
              </span>
            </a>
            <nav className="hidden md:flex gap-6">
              <a href="/" className="text-gray-700 hover:text-orange-500 transition-colors font-medium">
                Track
              </a>
              <a href="/dashboard" className="text-gray-700 hover:text-orange-500 transition-colors font-medium">
                Dashboard
              </a>
              <a href="/feed" className="text-gray-700 hover:text-orange-500 transition-colors font-medium">
                Feed
              </a>
              <a href="/leaderboard" className="text-gray-700 hover:text-orange-500 transition-colors font-medium">
                Leaderboard
              </a>
              <a href="/challenges" className="text-gray-700 hover:text-orange-500 transition-colors font-medium">
                Challenges
              </a>
              <a href="/social" className="text-gray-700 hover:text-orange-500 transition-colors font-medium">
                Social
              </a>
              <a href="/analytics" className="text-gray-700 hover:text-orange-500 transition-colors font-medium">
                Analytics
              </a>
              <a href="/safety" className="text-gray-700 hover:text-orange-500 transition-colors font-medium">
                Safety
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/profile"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-orange-500 transition-colors"
            >
              Profile
            </a>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-full hover:shadow-lg transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden border-t border-gray-100">
        <nav className="flex overflow-x-auto gap-4 px-4 py-2">
          <a href="/" className="text-sm text-gray-700 hover:text-orange-500 whitespace-nowrap font-medium">
            Track
          </a>
          <a href="/dashboard" className="text-sm text-gray-700 hover:text-orange-500 whitespace-nowrap font-medium">
            Dashboard
          </a>
          <a href="/feed" className="text-sm text-gray-700 hover:text-orange-500 whitespace-nowrap font-medium">
            Feed
          </a>
          <a href="/leaderboard" className="text-sm text-gray-700 hover:text-orange-500 whitespace-nowrap font-medium">
            Leaderboard
          </a>
          <a href="/challenges" className="text-sm text-gray-700 hover:text-orange-500 whitespace-nowrap font-medium">
            Challenges
          </a>
          <a href="/social" className="text-sm text-gray-700 hover:text-orange-500 whitespace-nowrap font-medium">
            Social
          </a>
          <a href="/analytics" className="text-sm text-gray-700 hover:text-orange-500 whitespace-nowrap font-medium">
            Analytics
          </a>
          <a href="/safety" className="text-sm text-gray-700 hover:text-orange-500 whitespace-nowrap font-medium">
            Safety
          </a>
        </nav>
      </div>
    </header>
  );
}
