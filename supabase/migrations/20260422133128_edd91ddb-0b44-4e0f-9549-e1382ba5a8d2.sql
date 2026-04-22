CREATE OR REPLACE FUNCTION public.normalize_exam_name_key(_name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  WITH parts AS (
    SELECT regexp_split_to_array(trim(public.normalize_arabic_name(_name)), E'\\s+') AS arr
  )
  SELECT CASE
    WHEN COALESCE(array_length(arr, 1), 0) = 0 THEN ''
    WHEN array_length(arr, 1) = 1 THEN arr[1]
    ELSE arr[1] || ' ' || arr[array_length(arr, 1)]
  END
  FROM parts
$$;

ALTER TABLE public.exam_attempts
ADD COLUMN IF NOT EXISTS student_name_key text;

UPDATE public.exam_attempts
SET
  student_name_normalized = trim(public.normalize_arabic_name(student_name)),
  student_name_key = public.normalize_exam_name_key(student_name)
WHERE student_name IS NOT NULL;

CREATE OR REPLACE FUNCTION public.set_attempt_name_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.student_name_normalized := trim(public.normalize_arabic_name(NEW.student_name));
  NEW.student_name_key := public.normalize_exam_name_key(NEW.student_name);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_exam_attempt_normalized_name ON public.exam_attempts;
DROP TRIGGER IF EXISTS set_exam_attempt_name_fields ON public.exam_attempts;
CREATE TRIGGER set_exam_attempt_name_fields
BEFORE INSERT OR UPDATE OF student_name
ON public.exam_attempts
FOR EACH ROW
EXECUTE FUNCTION public.set_attempt_name_fields();

CREATE INDEX IF NOT EXISTS idx_exam_attempts_exam_name_key
ON public.exam_attempts (exam_id, student_name_key);

CREATE OR REPLACE FUNCTION public.has_attempted_exam(_exam_id uuid, _student_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.exam_attempts
    WHERE exam_id = _exam_id
      AND student_name_key = public.normalize_exam_name_key(_student_name)
  )
$$;

CREATE OR REPLACE FUNCTION public.start_exam_attempt(
  _attempt_id uuid,
  _exam_id uuid,
  _student_name text,
  _college text,
  _total_questions integer
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _existing_id uuid;
  _exam_active boolean;
BEGIN
  SELECT is_active INTO _exam_active
  FROM public.exams
  WHERE id = _exam_id;

  IF COALESCE(_exam_active, false) = false THEN
    RAISE EXCEPTION 'EXAM_NOT_ACTIVE';
  END IF;

  SELECT id INTO _existing_id
  FROM public.exam_attempts
  WHERE exam_id = _exam_id
    AND student_name_key = public.normalize_exam_name_key(_student_name)
  LIMIT 1;

  IF _existing_id IS NOT NULL THEN
    RAISE EXCEPTION 'EXAM_ALREADY_TAKEN';
  END IF;

  INSERT INTO public.exam_attempts (
    id,
    exam_id,
    student_name,
    college,
    total_questions
  ) VALUES (
    _attempt_id,
    _exam_id,
    trim(_student_name),
    NULLIF(trim(_college), ''),
    COALESCE(_total_questions, 0)
  );

  RETURN _attempt_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_exam_attempt(
  _attempt_id uuid,
  _answers jsonb,
  _correct_count integer,
  _wrong_count integer,
  _total_questions integer,
  _percentage numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.exam_attempts
  SET
    finished_at = now(),
    answers = COALESCE(_answers, '[]'::jsonb),
    correct_count = COALESCE(_correct_count, 0),
    wrong_count = COALESCE(_wrong_count, 0),
    total_questions = COALESCE(_total_questions, 0),
    percentage = COALESCE(_percentage, 0)
  WHERE id = _attempt_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ATTEMPT_NOT_FOUND';
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.awareness_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  target_audience text,
  message text NOT NULL,
  image_urls text[] NOT NULL DEFAULT '{}'::text[],
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.awareness_posts ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.awareness_post_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.awareness_posts(id) ON DELETE CASCADE,
  visitor_key text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (post_id, visitor_key)
);

ALTER TABLE public.awareness_post_views ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.awareness_post_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.awareness_posts(id) ON DELETE CASCADE,
  visitor_key text NOT NULL,
  reaction text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (post_id, visitor_key)
);

ALTER TABLE public.awareness_post_reactions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.awareness_post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.awareness_posts(id) ON DELETE CASCADE,
  visitor_key text NOT NULL,
  author_name text,
  comment text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.awareness_post_comments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_awareness_posts_created_at
ON public.awareness_posts (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_awareness_post_views_post_id
ON public.awareness_post_views (post_id);

CREATE INDEX IF NOT EXISTS idx_awareness_post_reactions_post_id
ON public.awareness_post_reactions (post_id);

CREATE INDEX IF NOT EXISTS idx_awareness_post_comments_post_id
ON public.awareness_post_comments (post_id, created_at DESC);

DROP POLICY IF EXISTS "Public can view awareness posts" ON public.awareness_posts;
CREATE POLICY "Public can view awareness posts"
ON public.awareness_posts
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Admins manage awareness posts" ON public.awareness_posts;
CREATE POLICY "Admins manage awareness posts"
ON public.awareness_posts
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR is_college_admin(auth.uid()))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_college_admin(auth.uid()));

DROP POLICY IF EXISTS "Public can view awareness views" ON public.awareness_post_views;
CREATE POLICY "Public can view awareness views"
ON public.awareness_post_views
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Anyone can add awareness views" ON public.awareness_post_views;
CREATE POLICY "Anyone can add awareness views"
ON public.awareness_post_views
FOR INSERT
TO anon, authenticated
WITH CHECK (length(trim(visitor_key)) > 0);

DROP POLICY IF EXISTS "Anyone can update awareness views" ON public.awareness_post_views;
CREATE POLICY "Anyone can update awareness views"
ON public.awareness_post_views
FOR UPDATE
TO anon, authenticated
USING (length(trim(visitor_key)) > 0)
WITH CHECK (length(trim(visitor_key)) > 0);

DROP POLICY IF EXISTS "Admins can delete awareness views" ON public.awareness_post_views;
CREATE POLICY "Admins can delete awareness views"
ON public.awareness_post_views
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR is_college_admin(auth.uid()));

DROP POLICY IF EXISTS "Public can view awareness reactions" ON public.awareness_post_reactions;
CREATE POLICY "Public can view awareness reactions"
ON public.awareness_post_reactions
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Anyone can add awareness reactions" ON public.awareness_post_reactions;
CREATE POLICY "Anyone can add awareness reactions"
ON public.awareness_post_reactions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(trim(visitor_key)) > 0
  AND reaction IN ('like', 'dislike')
);

DROP POLICY IF EXISTS "Anyone can update own awareness reactions" ON public.awareness_post_reactions;
CREATE POLICY "Anyone can update own awareness reactions"
ON public.awareness_post_reactions
FOR UPDATE
TO anon, authenticated
USING (length(trim(visitor_key)) > 0)
WITH CHECK (
  length(trim(visitor_key)) > 0
  AND reaction IN ('like', 'dislike')
);

DROP POLICY IF EXISTS "Admins can delete awareness reactions" ON public.awareness_post_reactions;
CREATE POLICY "Admins can delete awareness reactions"
ON public.awareness_post_reactions
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR is_college_admin(auth.uid()));

DROP POLICY IF EXISTS "Public can view awareness comments" ON public.awareness_post_comments;
CREATE POLICY "Public can view awareness comments"
ON public.awareness_post_comments
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Anyone can add awareness comments" ON public.awareness_post_comments;
CREATE POLICY "Anyone can add awareness comments"
ON public.awareness_post_comments
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(trim(visitor_key)) > 0
  AND length(trim(comment)) > 0
);

DROP POLICY IF EXISTS "Admins can delete awareness comments" ON public.awareness_post_comments;
CREATE POLICY "Admins can delete awareness comments"
ON public.awareness_post_comments
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR is_college_admin(auth.uid()));