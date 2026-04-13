
-- PA Announcements
CREATE TABLE public.pa_announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_text TEXT NOT NULL,
  translations JSONB NOT NULL DEFAULT '{}'::jsonb,
  languages TEXT[] NOT NULL DEFAULT ARRAY['hi'],
  status TEXT NOT NULL DEFAULT 'broadcasting',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.pa_announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view announcements" ON public.pa_announcements FOR SELECT USING (true);
CREATE POLICY "Admins can manage announcements" ON public.pa_announcements FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Allow insert announcements" ON public.pa_announcements FOR INSERT WITH CHECK (true);

-- Registered Faces (Lost Child)
CREATE TABLE public.registered_faces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_name TEXT NOT NULL,
  parent_name TEXT NOT NULL,
  parent_phone TEXT,
  parent_email TEXT,
  photo_url TEXT,
  face_descriptor JSONB,
  age_approx INTEGER,
  registered_by UUID,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.registered_faces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view registered faces" ON public.registered_faces FOR SELECT USING (true);
CREATE POLICY "Anyone can register faces" ON public.registered_faces FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage faces" ON public.registered_faces FOR ALL USING (is_admin(auth.uid()));

-- Lost Child Alerts
CREATE TABLE public.lost_child_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  registered_face_id UUID REFERENCES public.registered_faces(id) ON DELETE CASCADE,
  screenshot_url TEXT,
  camera_location TEXT,
  confidence NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  found_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.lost_child_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view lost child alerts" ON public.lost_child_alerts FOR SELECT USING (true);
CREATE POLICY "Allow insert lost child alerts" ON public.lost_child_alerts FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage lost child alerts" ON public.lost_child_alerts FOR ALL USING (is_admin(auth.uid()));

-- Event Registrations (QR Check-in)
CREATE TABLE public.event_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  qr_code TEXT NOT NULL UNIQUE,
  checked_in BOOLEAN NOT NULL DEFAULT false,
  checked_in_at TIMESTAMP WITH TIME ZONE,
  health_cleared BOOLEAN NOT NULL DEFAULT false,
  zone_id UUID REFERENCES public.zones(id),
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can register" ON public.event_registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view registrations" ON public.event_registrations FOR SELECT USING (true);
CREATE POLICY "Admins can manage registrations" ON public.event_registrations FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Anyone can update registrations" ON public.event_registrations FOR UPDATE USING (true);

-- Health Screenings
CREATE TABLE public.health_screenings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id UUID NOT NULL REFERENCES public.event_registrations(id) ON DELETE CASCADE,
  temperature NUMERIC,
  symptoms TEXT[] DEFAULT ARRAY[]::TEXT[],
  has_fever BOOLEAN NOT NULL DEFAULT false,
  is_cleared BOOLEAN NOT NULL DEFAULT true,
  screened_by UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.health_screenings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view screenings" ON public.health_screenings FOR SELECT USING (true);
CREATE POLICY "Anyone can create screenings" ON public.health_screenings FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage screenings" ON public.health_screenings FOR ALL USING (is_admin(auth.uid()));

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.pa_announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lost_child_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_registrations;
