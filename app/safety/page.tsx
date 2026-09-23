'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import AuthGuard from '@/components/AuthGuard';

export default function SafetyPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [liveTracking, setLiveTracking] = useState<any>(null);
  const [newContact, setNewContact] = useState({ name: '', phone: '', email: '' });

  useEffect(() => {
    loadContacts();
    checkLiveTracking();
  }, []);

  const loadContacts = async () => {
    const { data } = await supabase
      .from('emergency_contacts')
      .select('*')
      .order('created_at', { ascending: false });
    setContacts(data || []);
  };

  const checkLiveTracking = async () => {
    const { data } = await supabase
      .from('live_tracking')
      .select('*')
      .eq('is_active', true)
      .single();
    setLiveTracking(data);
  };

  const addContact = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('emergency_contacts').insert({
      user_id: user.id,
      ...newContact,
    });

    setNewContact({ name: '', phone: '', email: '' });
    loadContacts();
  };

  const deleteContact = async (id: string) => {
    await supabase.from('emergency_contacts').delete().eq('id', id);
    loadContacts();
  };

  const startLiveTracking = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const token = Math.random().toString(36).substring(7);
        const { data, error } = await supabase.from('live_tracking').insert({
          user_id: user.id,
          share_token: token,
          is_active: true,
          last_location: `POINT(${position.coords.longitude} ${position.coords.latitude})`,
          last_update: new Date().toISOString()
        }).select().single();

        if (!error && data) {
          setLiveTracking(data);
          // Start updating location every 10 seconds
          startLocationUpdates(data.id);
          
          // Show share options
          shareTrackingLink(data.share_token, position.coords.latitude, position.coords.longitude);
        }
      });
    }
  };

  const shareTrackingLink = async (token: string, lat: number, lng: number) => {
    const trackingUrl = `${window.location.origin}/track/${token}`;
    const mapUrl = `https://maps.google.com/?q=${lat},${lng}`;
    const message = `📍 I'm sharing my live location with you!\n\n🔗 Track me here: ${trackingUrl}\n\n📌 Current location: ${mapUrl}\n\nStay updated in real-time!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: '📍 Live Location Tracking',
          text: message,
          url: trackingUrl
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(message);
      alert('Tracking link copied to clipboard!\n\nShare it with friends and family.');
    }
  };

  const startLocationUpdates = (trackingId: string) => {
    const interval = setInterval(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          await supabase
            .from('live_tracking')
            .update({
              last_location: `POINT(${position.coords.longitude} ${position.coords.latitude})`,
              last_update: new Date().toISOString()
            })
            .eq('id', trackingId);
        });
      }
    }, 10000); // Update every 10 seconds

    // Store interval ID to clear later
    (window as any).liveTrackingInterval = interval;
  };

  const stopLiveTracking = async () => {
    if (!liveTracking) return;
    
    // Clear location update interval
    if ((window as any).liveTrackingInterval) {
      clearInterval((window as any).liveTrackingInterval);
    }
    
    await supabase
      .from('live_tracking')
      .update({ is_active: false })
      .eq('id', liveTracking.id);
    setLiveTracking(null);
  };

  const sendSOS = async () => {
    if (contacts.length === 0) {
      alert('Please add emergency contacts first!');
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const message = `🚨 SOS Alert from Zyclist!\n\nI need help! My current location:\nhttps://maps.google.com/?q=${position.coords.latitude},${position.coords.longitude}\n\nPlease check on me!`;
        
        // Try native share first (works on mobile)
        if (navigator.share) {
          try {
            await navigator.share({
              title: '🚨 SOS Alert',
              text: message
            });
            return;
          } catch (error) {
            console.log('Share cancelled or failed');
          }
        }
        
        // Fallback: Open SMS app with pre-filled message (mobile only)
        if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
          const phones = contacts.map(c => c.phone).join(',');
          window.location.href = `sms:${phones}?body=${encodeURIComponent(message)}`;
        } else {
          // Desktop: Copy to clipboard
          navigator.clipboard.writeText(message);
          alert(`SOS message copied to clipboard!\n\nPlease send this to your emergency contacts:\n\n${contacts.map(c => `${c.name}: ${c.phone}`).join('\n')}`);
        }
      }, (error) => {
        alert('Unable to get location. Please enable location services.');
      });
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <Navbar />
        <div className="max-w-4xl mx-auto p-6">
          <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
            Safety Center
          </h1>

        <div className="bg-gradient-to-br from-red-500 to-red-700 p-6 mb-6 backdrop-blur-lg border-2 border-red-400">
          <h2 className="text-2xl font-bold mb-4 text-white">🚨 Emergency SOS</h2>
          <button
            onClick={sendSOS}
            className="w-full bg-white hover:bg-gray-100 text-red-600 py-4 font-bold text-lg transition-all transform hover:scale-105"
          >
            Send SOS Alert
          </button>
          <p className="text-sm text-red-100 mt-3">
            Sends your location to all emergency contacts
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg p-6 border border-white/20 mb-6">
          <h2 className="text-2xl font-bold mb-4 text-white">📍 Live Tracking</h2>
          {liveTracking ? (
            <div>
              <p className="mb-4 text-gray-300">Share this link with friends/family:</p>
              <div className="bg-black/30 p-4 mb-4 break-all text-orange-400 font-mono text-sm border border-orange-500/30">
                {window.location.origin}/track/{liveTracking.share_token}
              </div>
              <div className="flex gap-3 mb-4">
                <button
                  onClick={async () => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(async (position) => {
                        await shareTrackingLink(
                          liveTracking.share_token,
                          position.coords.latitude,
                          position.coords.longitude
                        );
                      });
                    }
                  }}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white px-6 py-3 font-semibold transition-all border-2 border-white"
                >
                  📤 Share Location
                </button>
                <button
                  onClick={stopLiveTracking}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 font-semibold transition-all"
                >
                  Stop Sharing
                </button>
              </div>
              <p className="text-xs text-gray-400">
                💡 Location updates every 10 seconds while active
              </p>
            </div>
          ) : (
            <button
              onClick={startLiveTracking}
              className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white px-6 py-3 font-semibold transition-all"
            >
              Start Live Tracking
            </button>
          )}
        </div>

        <div className="bg-white/10 backdrop-blur-lg p-6 border border-white/20">
          <h2 className="text-2xl font-bold mb-6 text-white">👥 Emergency Contacts</h2>
          
          <form onSubmit={addContact} className="mb-6 space-y-4">
            <input
              type="text"
              placeholder="Name"
              value={newContact.name}
              onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
              className="w-full px-4 py-3 bg-black/30 border border-white/20 text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none transition-all"
              required
            />
            <input
              type="tel"
              placeholder="Phone"
              value={newContact.phone}
              onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
              className="w-full px-4 py-3 bg-black/30 border border-white/20 text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none transition-all"
              required
            />
            <input
              type="email"
              placeholder="Email (optional)"
              value={newContact.email}
              onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
              className="w-full px-4 py-3 bg-black/30 border border-white/20 text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none transition-all"
            />
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white py-3 font-semibold transition-all transform hover:scale-105"
            >
              Add Contact
            </button>
          </form>

          <div className="space-y-3">
            {contacts.map((contact) => (
              <div key={contact.id} className="flex justify-between items-center p-4 bg-black/30 border border-white/10 hover:border-orange-500/50 transition-all">
                <div>
                  <div className="font-semibold text-white">{contact.name}</div>
                  <div className="text-sm text-gray-400">{contact.phone}</div>
                </div>
                <button
                  onClick={() => deleteContact(contact.id)}
                  className="text-red-400 hover:text-red-300 font-semibold transition-colors"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </AuthGuard>
  );
}
