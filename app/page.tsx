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
        // Don't auto-request location - let user click the button
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
    // Check if geolocation is available
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    // Check if we're on HTTP (not HTTPS) - required for mobile
    const isSecure = window.location.protocol === 'https:' || 
                     window.location.hostname === 'localhost' ||
                     window.location.hostname === '127.0.0.1';
    
    if (!isSecure && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      alert('⚠️ Location requires HTTPS on mobile!\n\nTo test on mobile:\n1. Deploy to Vercel/Netlify (free)\n2. Or use ngrok for HTTPS tunnel\n3. Or access via your computer\'s IP (http://192.168.x.x:3000)');
      return;
    }

    console.log('Requesting location permission...');
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationPermission('granted');
        console.log('✅ Location access granted:', position.coords);
      },
      (error) => {
        console.error('❌ Location error:', error);
        setLocationPermission('denied');
        
        let errorMessage = 'Location access denied. ';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please enable location in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
        }
        alert(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="text-2xl text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      {/* HTTPS Warning for Mobile */}
      {typeof window !== 'undefined' && 
       window.location.protocol === 'http:' && 
       window.location.hostname !== 'localhost' &&
       window.location.hostname !== '127.0.0.1' &&
       /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) && (
        <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-4 text-center">
          <p className="font-bold text-lg mb-1">⚠️ HTTPS Required for Location</p>
          <p className="text-sm mb-2">Mobile browsers need HTTPS to access GPS</p>
          <details className="text-xs text-left max-w-2xl mx-auto bg-black/20 p-3 mt-2">
            <summary className="cursor-pointer font-semibold mb-2">How to fix this?</summary>
            <div className="space-y-2">
              <p><strong>Option 1:</strong> Deploy to Vercel (free): <code>npm install -g vercel && vercel</code></p>
              <p><strong>Option 2:</strong> Use ngrok: <code>ngrok http 3000</code></p>
              <p><strong>Option 3:</strong> Access via computer IP: <code>http://192.168.x.x:3000</code></p>
              <p className="pt-2 border-t border-white/20">See MOBILE_ACCESS.md for detailed instructions</p>
            </div>
          </details>
        </div>
      )}
      
      {locationPermission === 'denied' && (
        <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-4 text-center">
          <p className="font-bold text-lg mb-1">📍 Location Access Denied</p>
          <p className="text-sm mb-2">Location is required for ride tracking</p>
          <details className="text-xs text-left max-w-2xl mx-auto bg-black/20 p-3 mt-2">
            <summary className="cursor-pointer font-semibold mb-2">How to enable location?</summary>
            <div className="space-y-2">
              <p><strong>Chrome (Android):</strong> Tap the lock icon in address bar → Permissions → Location → Allow</p>
              <p><strong>Safari (iOS):</strong> Settings → Safari → Location → Ask or Allow</p>
              <p><strong>Chrome (iOS):</strong> Settings → Chrome → Location → While Using the App</p>
              <p className="pt-2 border-t border-white/20">After enabling, refresh this page.</p>
            </div>
          </details>
        </div>
      )}
      {locationPermission === 'prompt' && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-4 text-center">
          <p className="font-bold text-lg mb-1">📍 Location Permission Needed</p>
          <p className="text-sm mb-3">Click below to enable GPS tracking</p>
          <button
            onClick={requestLocationPermission}
            className="px-8 py-3 bg-white text-blue-600 font-bold hover:bg-gray-100 transition-all border-4 border-blue-800 shadow-[4px_4px_0px_0px_rgba(30,58,138,0.5)] text-base"
          >
            🎯 Enable Location Access
          </button>
          <details className="text-xs text-left max-w-2xl mx-auto bg-black/20 p-3 mt-3">
            <summary className="cursor-pointer font-semibold mb-2">Not seeing the permission popup?</summary>
            <div className="space-y-2">
              <p>1. Make sure location is enabled on your device (Settings → Location)</p>
              <p>2. Check if you previously blocked this site (look for 🚫 icon in address bar)</p>
              <p>3. Try clearing browser cache and revisiting</p>
              <p>4. For HTTPS sites only: Some browsers require secure connection</p>
            </div>
          </details>
        </div>
      )}
      <div className="flex-1 overflow-hidden">
        <RideTracker />
      </div>
    </div>
  );
}
