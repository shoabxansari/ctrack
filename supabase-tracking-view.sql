-- Create a view that exposes lat/lng for live tracking
CREATE OR REPLACE VIEW live_tracking_view AS
SELECT 
  id,
  user_id,
  share_token,
  is_active,
  last_update,
  ST_Y(last_location::geometry) as lat,
  ST_X(last_location::geometry) as lng
FROM live_tracking;

-- Grant access to the view
GRANT SELECT ON live_tracking_view TO anon, authenticated;

-- Enable RLS on the view
ALTER VIEW live_tracking_view SET (security_invoker = true);
