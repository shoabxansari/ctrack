-- Enable PostGIS for geo queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Users table (Supabase auth handles this, but we can extend it)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  name TEXT,
  avatar_url TEXT,
  bio TEXT,
  total_distance FLOAT DEFAULT 0,
  total_rides INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rides table
CREATE TABLE rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  title TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  distance FLOAT DEFAULT 0,
  avg_speed FLOAT DEFAULT 0,
  max_speed FLOAT DEFAULT 0,
  elevation_gain FLOAT DEFAULT 0,
  route GEOGRAPHY(LINESTRING, 4326),
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ride points (for detailed tracking)
CREATE TABLE ride_points (
  id BIGSERIAL PRIMARY KEY,
  ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  speed FLOAT,
  altitude FLOAT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Followers table (social feature)
CREATE TABLE followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES profiles(id) NOT NULL,
  following_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- Ride likes
CREATE TABLE ride_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  ride_id UUID REFERENCES rides(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, ride_id)
);

-- Ride comments
CREATE TABLE ride_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  ride_id UUID REFERENCES rides(id) ON DELETE CASCADE NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Emergency contacts
CREATE TABLE emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Live tracking sessions (for safety feature)
CREATE TABLE live_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  ride_id UUID REFERENCES rides(id),
  share_token TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_location GEOGRAPHY(POINT, 4326),
  last_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Offline ride cache (for offline mode)
CREATE TABLE offline_rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  ride_data JSONB NOT NULL,
  synced BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_rides_user_id ON rides(user_id);
CREATE INDEX idx_rides_start_time ON rides(start_time);
CREATE INDEX idx_rides_public ON rides(is_public) WHERE is_public = true;
CREATE INDEX idx_ride_points_ride_id ON ride_points(ride_id);
CREATE INDEX idx_ride_points_location ON ride_points USING GIST(location);
CREATE INDEX idx_followers_follower ON followers(follower_id);
CREATE INDEX idx_followers_following ON followers(following_id);
CREATE INDEX idx_ride_likes_ride ON ride_likes(ride_id);
CREATE INDEX idx_ride_comments_ride ON ride_comments(ride_id);
CREATE INDEX idx_live_tracking_token ON live_tracking(share_token);
CREATE INDEX idx_live_tracking_active ON live_tracking(is_active) WHERE is_active = true;

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_rides ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Policies for rides
CREATE POLICY "Users can view own rides" ON rides FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Public rides are viewable by everyone" ON rides FOR SELECT USING (is_public = true);
CREATE POLICY "Users can insert own rides" ON rides FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rides" ON rides FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own rides" ON rides FOR DELETE USING (auth.uid() = user_id);

-- Policies for ride points
CREATE POLICY "Users can view own ride points" ON ride_points FOR SELECT 
  USING (EXISTS (SELECT 1 FROM rides WHERE rides.id = ride_points.ride_id AND rides.user_id = auth.uid()));
CREATE POLICY "Public ride points viewable" ON ride_points FOR SELECT 
  USING (EXISTS (SELECT 1 FROM rides WHERE rides.id = ride_points.ride_id AND rides.is_public = true));
CREATE POLICY "Users can insert own ride points" ON ride_points FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM rides WHERE rides.id = ride_points.ride_id AND rides.user_id = auth.uid()));

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
