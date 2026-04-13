-- Drop overly permissive update policy
DROP POLICY IF EXISTS "Anyone can update tokens" ON public.queue_tokens;

-- Create more restrictive update policy - only allow cancellation of waiting tokens
-- Admins can still update via the existing admin policy
CREATE POLICY "Users can cancel waiting tokens" 
ON public.queue_tokens 
FOR UPDATE 
USING (status = 'waiting')
WITH CHECK (status = 'cancelled');