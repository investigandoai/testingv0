-- Policy for authenticated users to view all profiles
-- This is a provisional policy to unblock login issues.
-- For a production app, you might want more granular control (e.g., users can only view their own profile or profiles of connections).
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);
