'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import AuthGuard from '@/components/AuthGuard';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create it
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert({ 
            id: user.id, 
            name: user.email?.split('@')[0] || 'Cyclist'
          })
          .select()
          .single();
        setProfile({ ...newProfile, email: user.email });
        setFormData({
          name: newProfile?.name || '',
          bio: newProfile?.bio || '',
        });
      } else {
        setProfile({ ...data, email: user.email });
        setFormData({
          name: data?.name || '',
          bio: data?.bio || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          bio: formData.bio,
        })
        .eq('id', user.id);

      if (error) throw error;

      setEditing(false);
      loadProfile();
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="p-8">Loading profile...</div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Navbar />
        <div className="max-w-4xl mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-5xl font-black text-gray-900 mb-2">Profile</h1>
            <p className="text-gray-600 text-lg">Manage your account and stats</p>
          </div>

          <div className="bg-white p-8 border border-gray-200 mb-6">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white text-5xl font-black">
                {profile?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-black text-gray-900">{profile?.name || 'Anonymous'}</h2>
                <p className="text-gray-600 mt-1">{profile?.bio || 'No bio yet'}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8 p-6 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200">
              <div className="text-center">
                <div className="text-3xl font-black text-gray-900">{profile?.total_rides || 0}</div>
                <div className="text-sm text-gray-600 font-medium">Total Rides</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-gray-900">
                  {profile?.total_distance?.toFixed(1) || 0} <span className="text-lg">km</span>
                </div>
                <div className="text-sm text-gray-600 font-medium">Total Distance</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-gray-900">
                  {profile?.total_rides > 0
                    ? (profile.total_distance / profile.total_rides).toFixed(1)
                    : 0}{' '}
                  <span className="text-lg">km</span>
                </div>
                <div className="text-sm text-gray-600 font-medium">Avg per Ride</div>
              </div>
            </div>

            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white py-3 font-bold hover:shadow-lg transition-all"
              >
                Edit Profile
              </button>
            ) : (
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 focus:outline-none focus:border-orange-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 focus:outline-none focus:border-orange-500 transition-colors"
                    rows={3}
                    placeholder="Tell us about yourself..."
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 text-white py-3 font-bold hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setFormData({
                        name: profile?.name || '',
                        bio: profile?.bio || '',
                      });
                    }}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 py-3 font-bold transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="bg-white p-8 border border-gray-200">
            <h3 className="text-2xl font-black text-gray-900 mb-6">Account Settings</h3>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 border border-gray-200">
                <div className="font-bold text-gray-900">Email</div>
                <div className="text-sm text-gray-600">{profile?.email || 'Not available'}</div>
              </div>
              <button
                onClick={async () => {
                  if (confirm('Are you sure you want to delete your account? This cannot be undone.')) {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                      await supabase.from('profiles').delete().eq('id', user.id);
                      await supabase.auth.signOut();
                    }
                  }
                }}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-3 font-bold transition-all"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
