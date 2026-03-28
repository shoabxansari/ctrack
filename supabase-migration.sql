-- Migration script to add new features to existing database
-- Run this instead of the full schema if tables already exist

-- Add new columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_distance FLOAT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_rides INT DEFAULT 0;

-- Add new columns to rides table
ALTER TABLE rides ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Create followers table (social feature)
CREATE TABLE IF NOT EXISTS followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES profiles(id) NOT NULL,
  following_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- Create ride likes table
CREATE TABLE IF NOT EXISTS ride_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  ride_id UUID REFERENCES rides(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, ride_id)
);

-- Create ride comments table
CREATE TABLE IF NOT EXISTS ride_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  ride_id UUID REFERENCES rides(id) ON DELETE CASCADE NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create emergency contacts table
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create live tracking table (for safety feature)
CREATE TABLE IF NOT EXISTS live_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  ride_id UUID REFERENCES rides(id),
  share_token TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_location GEOGRAPHY(POINT, 4326),
  last_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create offline rides table (for offline mode)
CREATE TABLE IF NOT EXISTS offline_rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  ride_data JSONB NOT NULL,
  synced BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_rides_public ON rides(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_followers_follower ON followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following ON followers(following_id);
CREATE INDEX IF NOT EXISTS idx_ride_likes_ride ON ride_likes(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_comments_ride ON ride_comments(ride_id);
CREATE INDEX IF NOT EXISTS idx_live_tracking_token ON live_tracking(share_token);
CREATE INDEX IF NOT EXISTS idx_live_tracking_active ON live_tracking(is_active) WHERE is_active = true;

-- Enable RLS on new tables
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_rides ENABLE ROW LEVEL SECURITY;

-- Add new policies for profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Add new policies for rides
DROP POLICY IF EXISTS "Public rides are viewable by everyone" ON rides;
CREATE POLICY "Public rides are viewable by everyone" ON rides FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "Users can delete own rides" ON rides;
CREATE POLICY "Users can delete own rides" ON rides FOR DELETE USING (auth.uid() = user_id);

-- Add policy for public ride points
DROP POLICY IF EXISTS "Public ride points viewable" ON ride_points;
CREATE POLICY "Public ride points viewable" ON ride_points FOR SELECT 
  USING (EXISTS (SELECT 1 FROM rides WHERE rides.id = ride_points.ride_id AND rides.is_public = true));

-- Policies for followers
CREATE POLICY "Anyone can view followers" ON followers FOR SELECT USING (true);
CREATE POLICY "Users can follow others" ON followers FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON followers FOR DELETE USING (auth.uid() = follower_id);

-- Policies for likes
CREATE POLICY "Anyone can view likes" ON ride_likes FOR SELECT USING (true);
CREATE POLICY "Users can like rides" ON ride_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike rides" ON ride_likes FOR DELETE USING (auth.uid() = user_id);

-- Policies for comments
CREATE POLICY "Anyone can view comments" ON ride_comments FOR SELECT USING (true);
CREATE POLICY "Users can comment" ON ride_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON ride_comments FOR DELETE USING (auth.uid() = user_id);

-- Policies for emergency contacts
CREATE POLICY "Users can view own contacts" ON emergency_contacts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own contacts" ON emergency_contacts FOR ALL USING (auth.uid() = user_id);

-- Policies for live tracking
CREATE POLICY "Users can view own tracking" ON live_tracking FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone with token can view tracking" ON live_tracking FOR SELECT USING (true);
CREATE POLICY "Users can manage own tracking" ON live_tracking FOR ALL USING (auth.uid() = user_id);

-- Policies for offline rides
CREATE POLICY "Users can manage own offline rides" ON offline_rides FOR ALL USING (auth.uid() = user_id);
