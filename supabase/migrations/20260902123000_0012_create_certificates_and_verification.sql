CREATE TABLE IF NOT EXISTS public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  certificate_number text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_certificates_student ON public.certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_course ON public.certificates(course_id);

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS certificates_student_read ON public.certificates;
CREATE POLICY certificates_student_read ON public.certificates
  FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR private.get_current_user_role() IN ('admin','developer'));

DROP POLICY IF EXISTS certificates_admin_write ON public.certificates;
CREATE POLICY certificates_admin_write ON public.certificates
  FOR ALL TO authenticated
  USING (private.get_current_user_role() IN ('admin','developer'))
  WITH CHECK (private.get_current_user_role() IN ('admin','developer'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificates TO authenticated;

CREATE OR REPLACE FUNCTION public.verify_certificate(p_certificate_number text)
RETURNS TABLE(certificate_number text, student_name text, course_title text, issue_date date)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT c.certificate_number, p.full_name, co.title, c.issue_date
  FROM public.certificates c
  JOIN public.profiles p ON p.id = c.student_id
  JOIN public.courses co ON co.id = c.course_id
  WHERE upper(c.certificate_number) = upper(trim(p_certificate_number));
$$;

REVOKE ALL ON FUNCTION public.verify_certificate(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_certificate(text) TO anon, authenticated;
