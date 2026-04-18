CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Admins can view roles" ON public.user_roles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  college TEXT NOT NULL,
  level TEXT NOT NULL,
  specialty TEXT,
  gender TEXT NOT NULL CHECK (gender IN ('male','female')),
  phone TEXT,
  committee_role TEXT,
  notes TEXT,
  join_year TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view members" ON public.members FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can register" ON public.members FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins can delete members" ON public.members FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update members" ON public.members FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_members_college ON public.members(college);
CREATE INDEX idx_members_level ON public.members(level);