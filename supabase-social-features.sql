-- Social Features Migration
-- Run this after the main schema

-- Posts table (for social feed)
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Likes table (for posts)
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Comments table (for posts)
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add missing columns to rides table for social features
ALTER TABLE rides ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE rides ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rides_user_id ON rides(user_id);
CREATE INDEX IF NOT EXISTS idx_rides_created_at ON rides(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_followers_following ON followers(follower_id, following_id);

-- Segments table for competition
CREATE TABLE IF NOT EXISTS segments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_point GEOGRAPHY(POINT, 4326) NOT NULL,
  end_point GEOGRAPHY(POINT, 4326) NOT NULL,
  route GEOGRAPHY(LINESTRING, 4326) NOT NULL,
  distance DECIMAL(10, 2) NOT NULL,
  elevation_gain DECIMAL(10, 2),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  is_public BOOLEAN DEFAULT true
);

-- Segment efforts (when someone rides a segment)
CREATE TABLE IF NOT EXISTS segment_efforts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  segment_id UUID REFERENCES segments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
  elapsed_time INTEGER NOT NULL, -- seconds
  avg_speed DECIMAL(5, 2),
  max_speed DECIMAL(5, 2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Challenges
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  challenge_type VARCHAR(50) NOT NULL, -- 'distance', 'rides', 'speed', 'segment'
  target_value DECIMAL(10, 2) NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Challenge participants
CREATE TABLE IF NOT EXISTS challenge_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  current_progress DECIMAL(10, 2) DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(challenge_id, user_id)
);

-- Achievements
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  achievement_type VARCHAR(50) NOT NULL, -- 'distance', 'speed', 'rides', 'streak'
  requirement_value DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'like', 'comment', 'follow', 'achievement', 'challenge'
  title VARCHAR(255) NOT NULL,
  message TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_segment_efforts_segment ON segment_efforts(segment_id);
CREATE INDEX IF NOT EXISTS idx_segment_efforts_user ON segment_efforts(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge ON challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user ON challenge_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- Insert some default achievements
INSERT INTO achievements (name, description, icon, achievement_type, requirement_value) VALUES
  ('First Ride', 'Complete your first ride', '🚴', 'rides', 1),
  ('Century', 'Ride 100km in a single ride', '💯', 'distance', 100),
  ('Speed Demon', 'Reach 40 km/h', '⚡', 'speed', 40),
  ('Consistent', '7-day riding streak', '🔥', 'streak', 7),
  ('Explorer', 'Complete 10 rides', '🗺️', 'rides', 10),
  ('Marathoner', 'Ride 500km total', '🏆', 'distance', 500),
  ('Legend', 'Ride 1000km total', '👑', 'distance', 1000),
  ('Early Bird', 'Ride before 6 AM', '🌅', 'special', 1),
  ('Night Owl', 'Ride after 10 PM', '🌙', 'special', 1),
  ('Social Butterfly', 'Get 50 likes', '🦋', 'social', 50)
ON CONFLICT DO NOTHING;

-- Function to update challenge progress
CREATE OR REPLACE FUNCTION update_challenge_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Update distance challenges
  UPDATE challenge_participants cp
  SET 
    current_progress = (
      SELECT COALESCE(SUM(r.distance), 0)
      FROM rides r
      WHERE r.user_id = NEW.user_id
        AND r.start_time >= c.start_date
        AND r.start_time <= c.end_date
    ),
    completed = (current_progress >= c.target_value),
    completed_at = CASE WHEN current_progress >= c.target_value THEN NOW() ELSE NULL END
  FROM challenges c
  WHERE cp.challenge_id = c.id
    AND cp.user_id = NEW.user_id
    AND c.challenge_type = 'distance';
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update challenge progress
DROP TRIGGER IF EXISTS trigger_update_challenge_progress ON rides;
CREATE TRIGGER trigger_update_challenge_progress
  AFTER INSERT OR UPDATE ON rides
  FOR EACH ROW
  EXECUTE FUNCTION update_challenge_progress();

-- Function to check and award achievements
CREATE OR REPLACE FUNCTION check_achievements()
RETURNS TRIGGER AS $$
BEGIN
  -- First ride achievement
  INSERT INTO user_achievements (user_id, achievement_id)
  SELECT NEW.user_id, a.id
  FROM achievements a
  WHERE a.achievement_type = 'rides' AND a.requirement_value = 1
    AND NOT EXISTS (
      SELECT 1 FROM user_achievements ua 
      WHERE ua.user_id = NEW.user_id AND ua.achievement_id = a.id
    );
  
  -- Distance achievements
  INSERT INTO user_achievements (user_id, achievement_id)
  SELECT NEW.user_id, a.id
  FROM achievements a
  WHERE a.achievement_type = 'distance'
    AND (SELECT COALESCE(SUM(distance), 0) FROM rides WHERE user_id = NEW.user_id) >= a.requirement_value
    AND NOT EXISTS (
      SELECT 1 FROM user_achievements ua 
      WHERE ua.user_id = NEW.user_id AND ua.achievement_id = a.id
    );
  
  -- Speed achievements
  INSERT INTO user_achievements (user_id, achievement_id)
  SELECT NEW.user_id, a.id
  FROM achievements a
  WHERE a.achievement_type = 'speed'
    AND NEW.max_speed >= a.requirement_value
    AND NOT EXISTS (
      SELECT 1 FROM user_achievements ua 
      WHERE ua.user_id = NEW.user_id AND ua.achievement_id = a.id
    );
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-award achievements
DROP TRIGGER IF EXISTS trigger_check_achievements ON rides;
CREATE TRIGGER trigger_check_achievements
  AFTER INSERT ON rides
  FOR EACH ROW
  EXECUTE FUNCTION check_achievements();

-- Enable Row Level Security
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE segment_efforts ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Posts viewable by everyone" ON posts FOR SELECT USING (true);
CREATE POLICY "Users can create posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their posts" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their posts" ON posts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Likes viewable by everyone" ON likes FOR SELECT USING (true);
CREATE POLICY "Users can like posts" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike posts" ON likes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Comments viewable by everyone" ON comments FOR SELECT USING (true);
CREATE POLICY "Users can comment" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their comments" ON comments FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Public segments are viewable by everyone" ON segments FOR SELECT USING (is_public = true);
CREATE POLICY "Users can create segments" ON segments FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their segments" ON segments FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Segment efforts viewable by everyone" ON segment_efforts FOR SELECT USING (true);
CREATE POLICY "Users can create segment efforts" ON segment_efforts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public challenges viewable by everyone" ON challenges FOR SELECT USING (is_public = true);
CREATE POLICY "Users can create challenges" ON challenges FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view challenge participants" ON challenge_participants FOR SELECT USING (true);
CREATE POLICY "Users can join challenges" ON challenge_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their participation" ON challenge_participants FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Achievements viewable by everyone" ON achievements FOR SELECT USING (true);

CREATE POLICY "Users can view their achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can award achievements" ON user_achievements FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (true);
