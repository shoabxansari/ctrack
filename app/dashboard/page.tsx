'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Ride } from '@/types';
import Navbar from '@/components/Navbar';
import AuthGuard from '@/components/AuthGuard';

export default function Dashboard() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRides();
  }, []);

  const loadRides = async () => {
    try {
      const { data, error } = await supabase
        .from('rides')
        .select('*')
        .order('start_time', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRides(data || []);
    } catch (error) {
      console.error('Error loading rides:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteRide = async (rideId: string, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this ride? This cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('rides')
        .delete()
        .eq('id', rideId);

      if (error) throw error;
      
      // Remove from local state
      setRides(rides.filter(r => r.id !== rideId));
      alert('Ride deleted successfully!');
    } catch (error) {
      console.error('Error deleting ride:', error);
      alert('Failed to delete ride. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDuration = (start: string, end?: string) => {
    if (!end) return 'In progress';
    const duration = new Date(end).getTime() - new Date(start).getTime();
    const hours = Math.floor(duration / 3600000);
    const minutes = Math.floor((duration % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Navbar />
        <div className="max-w-7xl mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-4xl font-black text-gray-900 mb-2">Your Rides</h1>
            <p className="text-gray-600">Track your progress and view your cycling history</p>
          </div>

        {rides.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
            <div className="text-6xl mb-4">🚴</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No rides yet</h3>
            <p className="text-gray-600 mb-6">Start your first ride to see it here!</p>
            <a
              href="/"
              className="inline-block px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-full font-semibold hover:shadow-lg transition-all"
            >
              Start Riding
            </a>
          </div>
        ) : (
          <div className="grid gap-4">
            {rides.map((ride) => (
              <div
                key={ride.id}
                className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100 group relative"
              >
                {/* Delete button - top right */}
                <button
                  onClick={(e) => deleteRide(ride.id, e)}
                  className="absolute top-4 right-4 p-2 bg-red-500 hover:bg-red-600 text-white transition-all opacity-0 group-hover:opacity-100 z-10"
                  title="Delete ride"
                >
                  🗑️
                </button>

                {/* Clickable ride content */}
                <a href={`/ride/${ride.id}`} className="block">
                  <div className="flex justify-between items-start mb-4 pr-12">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-orange-500 transition-colors">
                        {ride.title || formatDate(ride.start_time)}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {formatDuration(ride.start_time, ride.end_time)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
                      <div className="text-xs text-blue-600 font-medium mb-1">Distance</div>
                      <div className="text-2xl font-black text-blue-900">
                        {ride.distance.toFixed(2)}
                        <span className="text-sm font-normal ml-1">km</span>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl">
                      <div className="text-xs text-green-600 font-medium mb-1">Avg Speed</div>
                      <div className="text-2xl font-black text-green-900">
                        {ride.avg_speed.toFixed(1)}
                        <span className="text-sm font-normal ml-1">km/h</span>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl">
                      <div className="text-xs text-purple-600 font-medium mb-1">Max Speed</div>
                      <div className="text-2xl font-black text-purple-900">
                        {ride.max_speed.toFixed(1)}
                        <span className="text-sm font-normal ml-1">km/h</span>
                      </div>
                    </div>
                  </div>
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </AuthGuard>
  );
}
