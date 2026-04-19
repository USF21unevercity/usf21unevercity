CREATE OR REPLACE FUNCTION public.normalize_arabic_name(_name text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public
AS $$
  SELECT regexp_replace(
    translate(lower(coalesce(_name,'')), 'أإآاىئءؤةـ', 'ااااييءوه'),
    '\s+', ' ', 'g'
  )
$$;

CREATE OR REPLACE FUNCTION public.set_member_normalized_name()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  NEW.name_normalized := trim(public.normalize_arabic_name(NEW.full_name));
  RETURN NEW;
END;
$$;