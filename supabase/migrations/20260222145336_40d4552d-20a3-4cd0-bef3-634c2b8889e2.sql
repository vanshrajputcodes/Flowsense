
-- Create visitor_locations table for real-time GPS tracking
CREATE TABLE public.visitor_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id UUID,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  map_x DOUBLE PRECISION NOT NULL DEFAULT 50,
  map_y DOUBLE PRECISION NOT NULL DEFAULT 50,
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique index on session_id for upsert
CREATE UNIQUE INDEX idx_visitor_locations_session ON public.visitor_locations (session_id);

-- Create index on last_seen for cleanup
CREATE INDEX idx_visitor_locations_last_seen ON public.visitor_locations (last_seen);

-- Enable RLS
ALTER TABLE public.visitor_locations ENABLE ROW LEVEL SECURITY;

-- Anyone can insert/update their own location
CREATE POLICY "Anyone can upsert their location"
  ON public.visitor_locations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update their location"
  ON public.visitor_locations FOR UPDATE
  USING (true);

-- Admins can view all locations, users can view their own
CREATE POLICY "Admins can view all locations"
  ON public.visitor_locations FOR SELECT
  USING (is_admin(auth.uid()) OR session_id = COALESCE(auth.uid()::text, ''));

-- Anyone can read locations (needed for map display)
CREATE POLICY "Public read for visitor locations"
  ON public.visitor_locations FOR SELECT
  USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.visitor_locations;
