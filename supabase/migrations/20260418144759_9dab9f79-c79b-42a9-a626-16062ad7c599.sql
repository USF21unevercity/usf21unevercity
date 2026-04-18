
-- contact messages
CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  college text NOT NULL,
  level text NOT NULL,
  specialty text,
  phone text,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can send messages" ON public.contact_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins can view messages" ON public.contact_messages FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete messages" ON public.contact_messages FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update messages" ON public.contact_messages FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- certificate requests
CREATE TABLE public.certificate_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  college text NOT NULL,
  level text NOT NULL,
  specialty text,
  email text NOT NULL,
  phone text,
  certificate_type text NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.certificate_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can request certificate" ON public.certificate_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins can view certificates" ON public.certificate_requests FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete certificates" ON public.certificate_requests FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update certificates" ON public.certificate_requests FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- channel suggestions
CREATE TABLE public.channel_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_type text NOT NULL DEFAULT 'new',
  channel_name text NOT NULL,
  channel_url text NOT NULL,
  college text NOT NULL,
  level text,
  specialty text,
  suggester_name text,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.channel_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can suggest channel" ON public.channel_suggestions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins can view suggestions" ON public.channel_suggestions FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete suggestions" ON public.channel_suggestions FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update suggestions" ON public.channel_suggestions FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- library files
CREATE TABLE public.library_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  college text NOT NULL,
  level text NOT NULL,
  file_type text,
  file_url text NOT NULL,
  file_path text,
  uploader_name text,
  downloads integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.library_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view library" ON public.library_files FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can upload library" ON public.library_files FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins can delete library" ON public.library_files FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update library" ON public.library_files FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- storage bucket for library files
INSERT INTO storage.buckets (id, name, public) VALUES ('library', 'library', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Public read library" ON storage.objects FOR SELECT USING (bucket_id = 'library');
CREATE POLICY "Anyone can upload library files" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'library');
CREATE POLICY "Admins can delete library files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'library' AND has_role(auth.uid(), 'admin'));
