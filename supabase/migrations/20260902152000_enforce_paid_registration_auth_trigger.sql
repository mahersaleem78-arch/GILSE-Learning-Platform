CREATE OR REPLACE FUNCTION handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog AS $$
DECLARE
  v_order registration_orders%ROWTYPE;
  v_order_id uuid;
  v_referrer uuid;
BEGIN
  v_order_id := NULLIF(NEW.raw_user_meta_data->>'registration_order_id','')::uuid;
  IF v_order_id IS NULL THEN RAISE EXCEPTION 'Paid registration is required before creating an account.'; END IF;
  SELECT * INTO v_order FROM registration_orders WHERE id = v_order_id AND status = 'payment_verified' AND expires_at > now() AND lower(email) = lower(NEW.email) FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'A valid verified registration payment is required before creating an account.'; END IF;
  IF v_order.role = 'student' AND v_order.course_id IS NULL THEN RAISE EXCEPTION 'Student registration must include a paid course.'; END IF;
  IF v_order.role = 'instructor' AND v_order.course_id IS NOT NULL THEN RAISE EXCEPTION 'Instructor registration cannot include a student course.'; END IF;
  IF v_order.referral_code IS NOT NULL THEN SELECT id INTO v_referrer FROM profiles WHERE referral_code = upper(v_order.referral_code) LIMIT 1; END IF;
  INSERT INTO profiles (id,email,full_name,role,status,referral_code,referred_by)
  VALUES (NEW.id,NEW.email,v_order.full_name,v_order.role,'active',generate_referral_code(NEW.id),CASE WHEN v_referrer = NEW.id THEN NULL ELSE v_referrer END);
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION handle_new_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION handle_new_user() TO supabase_auth_admin;
