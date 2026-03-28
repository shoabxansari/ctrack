'use client';

import { useEffect, useRef, useState } from 'react';
import { useRideStore } from '@/store/rideStore';
import { useLocationStore } from '@/lib/locationStore';
import { GPSTracker } from '@/lib/gps';
import { supabase } from '@/lib/supabase';
import MapComponent from './Map';

// Default location: Jama Masjid, Delhi
const DEFAULT_LOCATION = { lat: 28.6508, lng: 77.2330 };

export default function RideTracker() {
  const { isTracking, currentRide, startRide, stopRide, addPoint, reset } = useRideStore();
  const { userLocation, setUserLocation } = useLocationStore();
  const trackerRef = useRef<GPSTracker | null>(null);
  const [gpsReady, setGpsReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const locationFetchedRef = useRef(false);

  useEffect(() => {
    // Get user's current location only once per session
    if (!locationFetchedRef.current && !userLocation) {
      locationFetchedRef.current = true;
      
      if (navigator.geolocation) {
        console.log('Fetching location for the first time...');
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const newLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            console.log('User location obtained:', newLocation);
            setUserLocation(newLocation);
          },
          (error) => {
            console.error('Error getting location:', error);
            setUserLocation(DEFAULT_LOCATION);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000, // Cache for 1 minute
          }
        );
      } else {
        setUserLocation(DEFAULT_LOCATION);
      }
    } else if (userLocation) {
      console.log('Using cached location:', userLocation);
    }
  }, []); // Empty dependency array - only run once

  useEffect(() => {
    // Resume tracking if it was active before app switch
    if (isTracking && !trackerRef.current) {
      trackerRef.current = new GPSTracker((point) => {
        addPoint(point);
        setUserLocation({ lat: point.lat, lng: point.lng });
        setGpsReady(true);
      });
      trackerRef.current.start();
    } else if (isTracking) {
      // Already tracking, just update GPS ready state
      setGpsReady(true);
    } else {
      trackerRef.current?.stop();
      setGpsReady(false);
    }

    return () => {
      // Don't stop tracker on unmount if still tracking
      if (!isTracking) {
        trackerRef.current?.stop();
      }
    };
  }, [isTracking, addPoint, setUserLocation]);

  // Update time every second for duration display
  useEffect(() => {
    if (isTracking) {
      const interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isTracking]);

  const handleStartRide = () => {
    startRide();
  };

  const handleStopRide = async () => {
    stopRide();

    // Save ride to Supabase or offline storage
    if (currentRide.points.length > 0) {
      try {
        const distance = calculateDistance(currentRide.points);
        const duration = Date.now() - (currentRide.startTime || 0);
        const avgSpeed = (distance / (duration / 1000 / 3600)) || 0;
        const maxSpeed = Math.max(...currentRide.points.map(p => (p.speed || 0) * 3.6));

        const { data: { user } } = await supabase.auth.getUser();
        
        if (user && navigator.onLine) {
          // Save to Supabase
          const { data: rideData } = await supabase.from('rides').insert({
            user_id: user.id,
            start_time: new Date(currentRide.startTime || 0).toISOString(),
            end_time: new Date().toISOString(),
            distance,
            avg_speed: avgSpeed,
            max_speed: maxSpeed,
          }).select().single();

          // Save ride points
          if (rideData) {
            const points = currentRide.points.map(p => ({
              ride_id: rideData.id,
              location: `POINT(${p.lng} ${p.lat})`,
              speed: p.speed,
              altitude: p.altitude,
              timestamp: new Date(p.timestamp).toISOString(),
            }));
            await supabase.from('ride_points').insert(points);
          }
        } else {
          // Save offline
          const { offlineStorage } = await import('@/lib/offlineStorage');
          offlineStorage.saveRide({
            id: currentRide.id || crypto.randomUUID(),
            startTime: currentRide.startTime || 0,
            endTime: Date.now(),
            points: currentRide.points,
            synced: false,
          });
        }

        reset();
      } catch (error) {
        console.error('Error saving ride:', error);
      }
    }
  };

  const calculateDistance = (points: typeof currentRide.points) => {
    let total = 0;
    for (let i = 1; i < points.length; i++) {
      total += getDistanceBetween(points[i - 1], points[i]);
    }
    return total;
  };

  const getDistanceBetween = (p1: any, p2: any) => {
    const R = 6371; // Earth radius in km
    const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
    const dLon = ((p2.lng - p1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((p1.lat * Math.PI) / 180) *
        Math.cos((p2.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const formatDuration = () => {
    if (!currentRide.startTime) return '00:00:00';
    const duration = currentTime - currentRide.startTime;
    const hours = Math.floor(duration / 3600000);
    const minutes = Math.floor((duration % 3600000) / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const mapCenter = userLocation 
    ? [userLocation.lng, userLocation.lat] as [number, number]
    : [DEFAULT_LOCATION.lng, DEFAULT_LOCATION.lat] as [number, number];

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 relative">
        <MapComponent 
          points={currentRide.points.length > 0 ? currentRide.points : []} 
          center={mapCenter}
        />
        
        {!userLocation && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-500 to-blue-700 text-white px-6 py-3 shadow-lg z-10 border-2 border-blue-400 font-semibold">
            📍 Getting your location...
          </div>
        )}

        {userLocation && userLocation.lat === DEFAULT_LOCATION.lat && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-orange-500 to-pink-500 text-white px-6 py-3 shadow-lg z-10 text-sm border-2 border-orange-400 font-semibold">
            📍 Using default location (Delhi). Enable location for accuracy.
          </div>
        )}
        
        {isTracking && !gpsReady && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-yellow-700 text-white px-6 py-3 shadow-lg z-10 border-2 border-yellow-400 font-semibold">
            📡 Waiting for GPS signal...
          </div>
        )}
        
        {isTracking && gpsReady && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-green-500 to-green-700 text-white px-6 py-3 shadow-lg z-10 border-2 border-green-400 font-semibold animate-pulse">
            🚴 Recording...
          </div>
        )}

        {!navigator.onLine && (
          <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 shadow-lg z-10 border-2 border-orange-400 font-semibold">
            📴 Offline Mode - Ride will sync later
          </div>
        )}
      </div>

      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black p-6 border-t-2 border-orange-500/30">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center bg-white/5 backdrop-blur-lg p-4 border border-white/10">
            <div className="text-sm text-gray-400">Distance</div>
            <div className="text-2xl font-bold text-white">
              {calculateDistance(currentRide.points).toFixed(2)} km
            </div>
          </div>
          <div className="text-center bg-white/5 backdrop-blur-lg p-4 border border-white/10">
            <div className="text-sm text-gray-400">Duration</div>
            <div className="text-2xl font-bold text-white">{formatDuration()}</div>
          </div>
          <div className="text-center bg-white/5 backdrop-blur-lg p-4 border border-white/10">
            <div className="text-sm text-gray-400">Speed</div>
            <div className="text-2xl font-bold text-white">
              {currentRide.points.length > 0
                ? ((currentRide.points[currentRide.points.length - 1].speed || 0) * 3.6).toFixed(1)
                : '0.0'}{' '}
              km/h
            </div>
          </div>
        </div>

        <button
          onClick={isTracking ? handleStopRide : handleStartRide}
          className={`w-full py-4 font-bold text-lg transition-all transform hover:scale-105 ${
            isTracking
              ? 'bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white border-2 border-red-400'
              : 'bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white border-2 border-green-400'
          }`}
        >
          {isTracking ? '⏹ Stop Ride' : '▶ Start Ride'}
        </button>
      </div>
    </div>
  );
}
