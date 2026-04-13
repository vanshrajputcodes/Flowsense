-- Drop existing insert policy that requires authentication
DROP POLICY IF EXISTS "Authenticated users can create tokens" ON public.queue_tokens;

-- Create new policy that allows anyone to insert tokens (for anonymous queue joining)
CREATE POLICY "Anyone can create tokens" 
ON public.queue_tokens 
FOR INSERT 
WITH CHECK (true);

-- Update select policy to allow anyone to view their token by ID
DROP POLICY IF EXISTS "Users can view their own tokens" ON public.queue_tokens;

CREATE POLICY "Anyone can view tokens" 
ON public.queue_tokens 
FOR SELECT 
USING (true);

-- Update policy to allow anyone to update their own token (for cancellation)
DROP POLICY IF EXISTS "Users can update their own tokens" ON public.queue_tokens;

CREATE POLICY "Anyone can update tokens" 
ON public.queue_tokens 
FOR UPDATE 
USING (true);