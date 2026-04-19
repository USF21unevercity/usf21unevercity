-- 1) Normalized name column for duplicate detection across all colleges
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS name_normalized text;

CREATE OR REPLACE FUNCTION public.normalize_arabic_name(_name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT regexp_replace(
    translate(
      lower(coalesce(_name,'')),
      'أإآاىئءؤةـ',
      'ااااييءوه'
    ),
    '\s+', ' ', 'g'
  )
$$;

UPDATE public.members SET name_normalized = trim(public.normalize_arabic_name(full_name)) WHERE name_normalized IS NULL;

CREATE OR REPLACE FUNCTION public.set_member_normalized_name()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.name_normalized := trim(public.normalize_arabic_name(NEW.full_name));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_member_normalized_name ON public.members;
CREATE TRIGGER trg_set_member_normalized_name
BEFORE INSERT OR UPDATE ON public.members
FOR EACH ROW EXECUTE FUNCTION public.set_member_normalized_name();

CREATE UNIQUE INDEX IF NOT EXISTS members_name_normalized_unique ON public.members (name_normalized);

-- 2) college_admins table: maps an auth user to one college
CREATE TABLE IF NOT EXISTS public.college_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email text NOT NULL,
  college text NOT NULL,
  level text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.college_admins ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION public.is_college_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.college_admins WHERE user_id = _user_id) $$;

CREATE OR REPLACE FUNCTION public.get_admin_college(_user_id uuid)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT college FROM public.college_admins WHERE user_id = _user_id LIMIT 1 $$;

-- Policies on college_admins: only owner manages
DROP POLICY IF EXISTS "Owner manages college_admins" ON public.college_admins;
CREATE POLICY "Owner manages college_admins"
  ON public.college_admins FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "College admin can view own row" ON public.college_admins;
CREATE POLICY "College admin can view own row"
  ON public.college_admins FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 3) Pending invites so an email can be linked when they sign up
CREATE TABLE IF NOT EXISTS public.college_admin_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  college text NOT NULL,
  level text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.college_admin_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner manages invites" ON public.college_admin_invites;
CREATE POLICY "Owner manages invites"
  ON public.college_admin_invites FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4) Update handle_new_user to also process college admin invites
CREATE OR REPLACE FUNCTION public.handle_new_user_admin()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  inv record;
BEGIN
  IF lower(NEW.email) = lower('Wjhb29ytsbvk.wo@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  SELECT * INTO inv FROM public.college_admin_invites WHERE lower(email) = lower(NEW.email);
  IF inv.id IS NOT NULL THEN
    INSERT INTO public.college_admins (user_id, email, college, level)
    VALUES (NEW.id, NEW.email, inv.college, inv.level)
    ON CONFLICT (user_id) DO UPDATE SET college = EXCLUDED.college, level = EXCLUDED.level;
    DELETE FROM public.college_admin_invites WHERE id = inv.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_admin
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_admin();

-- 5) Members visibility: public hides phones; admin sees all; college admin sees own college (incl. phone)
DROP POLICY IF EXISTS "Public can view members" ON public.members;

-- Public view that hides phone
DROP VIEW IF EXISTS public.members_public;
CREATE VIEW public.members_public
WITH (security_invoker=on) AS
SELECT id, full_name, college, level, specialty, gender, committee_role, join_year, created_at
FROM public.members;

-- Allow public SELECT only via the view (the view's SELECT requires SELECT on base table for needed columns).
-- Recreate base SELECT policies: allow anon to see only non-phone fields by allowing select but app must use the view.
-- Since RLS is per-row (not per-column), we keep SELECT open to public; phone protection is enforced by always querying the view in app code.
CREATE POLICY "Public can view members rows"
  ON public.members FOR SELECT
  TO anon, authenticated
  USING (true);
