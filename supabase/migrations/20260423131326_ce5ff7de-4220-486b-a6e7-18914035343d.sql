
CREATE TABLE IF NOT EXISTS public.site_visits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_key text NOT NULL,
  path text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_site_visits_created_at ON public.site_visits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_visits_visitor_key ON public.site_visits(visitor_key);

ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record a visit"
ON public.site_visits
FOR INSERT
TO anon, authenticated
WITH CHECK (length(trim(visitor_key)) > 0);

CREATE POLICY "Admins can view visits"
ON public.site_visits
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR is_college_admin(auth.uid()));

CREATE POLICY "Admins can delete visits"
ON public.site_visits
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
