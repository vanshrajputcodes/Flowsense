-- Fix queue_tokens RLS - add admin update policy for calling/serving tokens
CREATE POLICY "Admins can update all tokens" 
ON public.queue_tokens 
FOR UPDATE 
USING (is_admin(auth.uid()));