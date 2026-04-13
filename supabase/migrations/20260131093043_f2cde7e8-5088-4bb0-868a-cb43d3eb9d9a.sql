-- Create SOS requests table
CREATE TABLE public.sos_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    token_number text NOT NULL,
    phone text,
    location text,
    message text,
    zone_id uuid REFERENCES public.zones(id) ON DELETE SET NULL,
    status text NOT NULL DEFAULT 'active',
    responded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    responded_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sos_requests ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can create SOS requests"
ON public.sos_requests
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can view their own SOS requests"
ON public.sos_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "Admins can update SOS requests"
ON public.sos_requests
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete SOS requests"
ON public.sos_requests
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));

-- Enable realtime for SOS requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.sos_requests;