export interface Ride {
  id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  distance: number;
  avg_speed: number;
  max_speed: number;
  elevation_gain?: number;
  route?: any;
  created_at: string;
}

export interface Profile {
  id: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
}
