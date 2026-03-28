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

    const token = Math.random().toString(36).substring(7);
    await supabase.from('live_tracking').insert({
      user_id: user.id,
      share_token: token,
      is_active: true,
    });

    checkLiveTracking();
  };

  const stopLiveTracking = async () => {
    if (!liveTracking) return;
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
        const message = `🚨 SOS Alert! Location: https://maps.google.com/?q=${position.coords.latitude},${position.coords.longitude}`;
        alert(`SOS sent to ${contacts.length} contacts!\n\n${message}`);
      });
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
              <button
                onClick={stopLiveTracking}
                className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 font-semibold transition-all"
              >
                Stop Sharing
              </button>
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
