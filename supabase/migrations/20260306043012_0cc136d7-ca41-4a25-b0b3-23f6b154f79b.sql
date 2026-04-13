
-- Create threat_logs table
CREATE TABLE public.threat_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  object TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'weapon',
  severity TEXT NOT NULL DEFAULT 'high',
  confidence INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  screenshot_url TEXT,
  zone_id UUID REFERENCES public.zones(id),
  reviewed BOOLEAN NOT NULL DEFAULT false,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.threat_logs ENABLE ROW LEVEL SECURITY;

-- Admin can read all
CREATE POLICY "Admins can view threat logs" ON public.threat_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin can update (review)
CREATE POLICY "Admins can update threat logs" ON public.threat_logs
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow insert from edge functions (anon for service calls)
CREATE POLICY "Allow insert threat logs" ON public.threat_logs
  FOR INSERT TO authenticated, anon
  WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.threat_logs;

-- Create storage bucket for threat screenshots
INSERT INTO storage.buckets (id, name, public) VALUES ('threat-screenshots', 'threat-screenshots', true);

-- Storage policies
CREATE POLICY "Anyone can upload threat screenshots" ON storage.objects
  FOR INSERT TO authenticated, anon
  WITH CHECK (bucket_id = 'threat-screenshots');

CREATE POLICY "Anyone can view threat screenshots" ON storage.objects
  FOR SELECT TO authenticated, anon
  USING (bucket_id = 'threat-screenshots');
