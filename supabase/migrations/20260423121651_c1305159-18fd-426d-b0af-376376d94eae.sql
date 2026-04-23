-- Add status column for moderation
ALTER TABLE public.library_files
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';

-- Mark all existing files as approved (so nothing disappears)
UPDATE public.library_files SET status = 'approved' WHERE status = 'pending';

-- Replace public SELECT policy: only approved files are visible to public
DROP POLICY IF EXISTS "Public can view library" ON public.library_files;

CREATE POLICY "Public can view approved library"
ON public.library_files
FOR SELECT
TO anon, authenticated
USING (status = 'approved');

-- Admins can see all (including pending) for moderation
CREATE POLICY "Admins can view all library"
ON public.library_files
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR is_college_admin(auth.uid()));

-- Allow college admins to update/delete their college files too
DROP POLICY IF EXISTS "College admins can update library" ON public.library_files;
CREATE POLICY "College admins can update library"
ON public.library_files
FOR UPDATE
TO authenticated
USING (is_college_admin(auth.uid()) AND college = get_admin_college(auth.uid()))
WITH CHECK (is_college_admin(auth.uid()) AND college = get_admin_college(auth.uid()));

DROP POLICY IF EXISTS "College admins can delete library" ON public.library_files;
CREATE POLICY "College admins can delete library"
ON public.library_files
FOR DELETE
TO authenticated
USING (is_college_admin(auth.uid()) AND college = get_admin_college(auth.uid()));