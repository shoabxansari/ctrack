-- Fix for location tracking - Convert PostGIS GEOGRAPHY to lat/lng

-- Create function to get tracking location as lat/lng
CREATE OR REPLACE FUNCTION get_tracking_location(tracking_id UUID)
RETURNS TABLE (lat DOUBLE PRECISION, lng DOUBLE PRECISION) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ST_Y(last_location::geometry) as lat,
    ST_X(last_location::geometry) as lng
  FROM live_tracking
  WHERE id = tracking_id AND last_location IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_tracking_location(UUID) TO anon, authenticated;
