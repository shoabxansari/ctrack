'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AuthForm from '@/components/AuthForm';
import RideTracker from '@/components/RideTracker';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    checkLocationPermission();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        setUser(session?.user ?? null);
        requestLocationPermission();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        router.push('/landing');
      } else {
        setUser(session?.user ?? null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/landing');
      return;
    }
    setUser(session?.user ?? null);
    setLoading(false);
  };

  const checkLocationPermission = async () => {
    if (navigator.permissions) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        setLocationPermission(result.state);
        result.onchange = () => {
          setLocationPermission(result.state);
        };
      } catch (error) {
        console.log('Permission API not supported');
      }
    }
  };

  const requestLocationPermission = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationPermission('granted');
          console.log('Location access granted:', position.coords);
        },
        (error) => {
          setLocationPermission('denied');
          console.error('Location access denied:', error);
          alert('Location access denied. Please enable location in your browser settings.');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="text-2xl text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to landing
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Navbar />
      {locationPermission === 'denied' && (
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-3 text-center">
          <p className="font-semibold">📍 Location access is required for ride tracking</p>
          <p className="text-sm">Please enable location in your browser settings</p>
        </div>
      )}
      {locationPermission === 'prompt' && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-3 text-center">
          <p className="font-semibold">📍 Location Permission Needed</p>
          <button
            onClick={requestLocationPermission}
            className="mt-2 px-6 py-2 bg-white text-blue-600 font-semibold hover:bg-gray-100 transition-all"
          >
            Enable Location Access
          </button>
        </div>
      )}
      <div className="flex-1 overflow-hidden">
        <RideTracker />
      </div>
    </div>
  );
}
