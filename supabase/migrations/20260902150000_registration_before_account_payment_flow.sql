/*
  Paid-first registration:
  - Students must pay for one published paid course before an Auth account/profile is created.
  - Instructors must pay the fixed $100 onboarding fee before an Auth account/profile is created.
  - Course sales allocate 50% to the instructor and 50% to GILSE.
*/
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS registration_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_token_hash text NOT NULL UNIQUE,
  role text NOT NULL CHECK (role IN ('student','instructor')),
  email text NOT NULL,
  full_name text NOT NULL,
  referral_code text,
  course_id uuid REFERENCES courses(id) ON DELETE RESTRICT,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('pending_payment','payment_verified','consumed','expired','cancelled')),
  tx_hash text,
  verification_error text,
  verification_attempts integer NOT NULL DEFAULT 0 CHECK (verification_attempts >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  verified_at timestamptz,
  consumed_at timestamptz,
  CONSTRAINT registration_course_rule CHECK ((role = 'student' AND course_id IS NOT NULL) OR (role = 'instructor' AND course_id IS NULL))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_registration_orders_email_pending ON registration_orders (lower(email)) WHERE status IN ('pending_payment','payment_verified');
CREATE UNIQUE INDEX IF NOT EXISTS idx_registration_orders_tx_hash ON registration_orders (lower(tx_hash)) WHERE tx_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_registration_orders_status_expires ON registration_orders (status, expires_at);

CREATE TABLE IF NOT EXISTS registration_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_order_id uuid NOT NULL UNIQUE REFERENCES registration_orders(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'USD',
  asset text NOT NULL DEFAULT 'USDT',
  network text NOT NULL DEFAULT 'TRON',
  wallet_address text NOT NULL,
  tx_hash text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'verified' CHECK (status IN ('verified','failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_registration_payments_tx_hash ON registration_payments(tx_hash);

ALTER TABLE registration_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_payments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON registration_orders FROM anon, authenticated;
REVOKE ALL ON registration_payments FROM anon, authenticated;

CREATE OR REPLACE FUNCTION create_registration_order(
  p_role text,
  p_email text,
  p_full_name text,
  p_course_id uuid DEFAULT NULL,
  p_referral_code text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog
AS $$
DECLARE
  v_role text := lower(trim(p_role));
  v_email text := lower(trim(p_email));
  v_name text := trim(p_full_name);
  v_course courses%ROWTYPE;
  v_amount numeric(12,2);
  v_token text := encode(gen_random_bytes(32), 'hex');
  v_order registration_orders%ROWTYPE;
BEGIN
  IF v_role NOT IN ('student','instructor') THEN RAISE EXCEPTION 'Invalid registration role.'; END IF;
  IF v_email !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN RAISE EXCEPTION 'Enter a valid email address.'; END IF;
  IF length(v_name) < 2 OR length(v_name) > 120 THEN RAISE EXCEPTION 'Enter a valid full name.'; END IF;
  IF EXISTS (SELECT 1 FROM auth.users u WHERE lower(u.email) = v_email) THEN RAISE EXCEPTION 'An account already exists for this email. Please sign in.'; END IF;
  IF EXISTS (SELECT 1 FROM registration_orders r WHERE lower(r.email) = v_email AND r.status IN ('pending_payment','payment_verified') AND r.expires_at > now()) THEN RAISE EXCEPTION 'A registration payment is already in progress for this email.'; END IF;

  IF v_role = 'student' THEN
    SELECT * INTO v_course FROM courses WHERE id = p_course_id AND status = 'published';
    IF NOT FOUND THEN RAISE EXCEPTION 'Select a published course.'; END IF;
    IF v_course.price <= 0 THEN RAISE EXCEPTION 'Student registration requires a paid course.'; END IF;
    v_amount := v_course.price;
  ELSE
    v_amount := 100.00;
  END IF;

  INSERT INTO registration_orders (registration_token_hash, role, email, full_name, referral_code, course_id, amount, currency)
  VALUES (encode(digest(v_token, 'sha256'), 'hex'), v_role, v_email, v_name,
          CASE WHEN p_referral_code ~* '^GILSE-[A-Z0-9]{8}$' THEN upper(trim(p_referral_code)) ELSE NULL END,
          p_course_id, v_amount, 'USD')
  RETURNING * INTO v_order;

  RETURN jsonb_build_object('order_id', v_order.id, 'registration_token', v_token, 'role', v_role, 'email', v_email, 'amount', v_amount, 'currency', 'USD', 'expires_at', v_order.expires_at, 'course_id', p_course_id);
END;
$$;
REVOKE ALL ON FUNCTION create_registration_order(text,text,text,uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_registration_order(text,text,text,uuid,text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION expire_registration_orders() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog
AS $$
DECLARE v_count integer;
BEGIN
  UPDATE registration_orders SET status = 'expired' WHERE status IN ('pending_payment','payment_verified') AND expires_at <= now();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
REVOKE ALL ON FUNCTION expire_registration_orders() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION expire_registration_orders() TO service_role;

ALTER TABLE courses ADD COLUMN IF NOT EXISTS instructor_id uuid REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS instructor_share_percent numeric(5,2) NOT NULL DEFAULT 50 CHECK (instructor_share_percent >= 0 AND instructor_share_percent <= 100);
CREATE INDEX IF NOT EXISTS idx_courses_instructor_id ON courses(instructor_id);

CREATE TABLE IF NOT EXISTS instructor_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
  payment_id uuid NOT NULL UNIQUE REFERENCES payments(id) ON DELETE RESTRICT,
  gross_amount numeric(12,2) NOT NULL CHECK (gross_amount > 0),
  instructor_share_percent numeric(5,2) NOT NULL DEFAULT 50 CHECK (instructor_share_percent >= 0 AND instructor_share_percent <= 100),
  instructor_amount numeric(12,2) NOT NULL CHECK (instructor_amount >= 0),
  platform_amount numeric(12,2) NOT NULL CHECK (platform_amount >= 0),
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('pending_approval','approved','paid','rejected')),
  approved_by uuid REFERENCES profiles(id),
  approved_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_instructor_payouts_instructor_status ON instructor_payouts(instructor_id,status);
ALTER TABLE instructor_payouts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS instructor_payouts_read ON instructor_payouts;
CREATE POLICY instructor_payouts_read ON instructor_payouts FOR SELECT TO authenticated USING (instructor_id = auth.uid() OR get_current_user_role() IN ('admin','developer'));
DROP POLICY IF EXISTS instructor_payouts_admin_update ON instructor_payouts;
CREATE POLICY instructor_payouts_admin_update ON instructor_payouts FOR UPDATE TO authenticated USING (get_current_user_role() IN ('admin','developer')) WITH CHECK (get_current_user_role() IN ('admin','developer'));
GRANT SELECT, UPDATE ON instructor_payouts TO authenticated;

DROP POLICY IF EXISTS insert_courses_instructor ON courses;
CREATE POLICY insert_courses_instructor ON courses FOR INSERT TO authenticated WITH CHECK (get_current_user_role() IN ('admin','developer') OR (get_current_user_role() = 'instructor' AND instructor_id = auth.uid() AND status = 'draft' AND instructor_share_percent = 50));
DROP POLICY IF EXISTS update_courses_instructor ON courses;
CREATE POLICY update_courses_instructor ON courses FOR UPDATE TO authenticated USING (get_current_user_role() IN ('admin','developer') OR (get_current_user_role() = 'instructor' AND instructor_id = auth.uid() AND status = 'draft')) WITH CHECK (get_current_user_role() IN ('admin','developer') OR (get_current_user_role() = 'instructor' AND instructor_id = auth.uid() AND status = 'draft' AND instructor_share_percent = 50));
DROP POLICY IF EXISTS insert_modules_instructor ON modules;
CREATE POLICY insert_modules_instructor ON modules FOR INSERT TO authenticated WITH CHECK (get_current_user_role() IN ('admin','developer') OR (get_current_user_role() = 'instructor' AND EXISTS (SELECT 1 FROM courses c WHERE c.id = course_id AND c.instructor_id = auth.uid() AND c.status = 'draft')));
DROP POLICY IF EXISTS update_modules_instructor ON modules;
CREATE POLICY update_modules_instructor ON modules FOR UPDATE TO authenticated USING (get_current_user_role() IN ('admin','developer') OR (get_current_user_role() = 'instructor' AND EXISTS (SELECT 1 FROM courses c WHERE c.id = course_id AND c.instructor_id = auth.uid() AND c.status = 'draft'))) WITH CHECK (get_current_user_role() IN ('admin','developer') OR (get_current_user_role() = 'instructor' AND EXISTS (SELECT 1 FROM courses c WHERE c.id = course_id AND c.instructor_id = auth.uid() AND c.status = 'draft')));
DROP POLICY IF EXISTS insert_lessons_instructor ON lessons;
CREATE POLICY insert_lessons_instructor ON lessons FOR INSERT TO authenticated WITH CHECK (get_current_user_role() IN ('admin','developer') OR (get_current_user_role() = 'instructor' AND EXISTS (SELECT 1 FROM modules m JOIN courses c ON c.id=m.course_id WHERE m.id = module_id AND c.instructor_id = auth.uid() AND c.status = 'draft')));
DROP POLICY IF EXISTS update_lessons_instructor ON lessons;
CREATE POLICY update_lessons_instructor ON lessons FOR UPDATE TO authenticated USING (get_current_user_role() IN ('admin','developer') OR (get_current_user_role() = 'instructor' AND EXISTS (SELECT 1 FROM modules m JOIN courses c ON c.id=m.course_id WHERE m.id = module_id AND c.instructor_id = auth.uid() AND c.status = 'draft'))) WITH CHECK (get_current_user_role() IN ('admin','developer') OR (get_current_user_role() = 'instructor' AND EXISTS (SELECT 1 FROM modules m JOIN courses c ON c.id=m.course_id WHERE m.id = module_id AND c.instructor_id = auth.uid() AND c.status = 'draft')));
