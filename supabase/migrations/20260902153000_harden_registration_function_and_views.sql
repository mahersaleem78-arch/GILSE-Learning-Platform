CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO anon, authenticated;
CREATE OR REPLACE FUNCTION private.create_registration_order(p_role text,p_email text,p_full_name text,p_course_id uuid DEFAULT NULL,p_referral_code text DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, pg_catalog AS $$
DECLARE v_role text := lower(trim(p_role)); v_email text := lower(trim(p_email)); v_name text := trim(p_full_name); v_course courses%ROWTYPE; v_amount numeric(12,2); v_token text := encode(extensions.gen_random_bytes(32), 'hex'); v_order registration_orders%ROWTYPE;
BEGIN
  IF v_role NOT IN ('student','instructor') THEN RAISE EXCEPTION 'Invalid registration role.'; END IF;
  IF v_email !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN RAISE EXCEPTION 'Enter a valid email address.'; END IF;
  IF length(v_name) < 2 OR length(v_name) > 120 THEN RAISE EXCEPTION 'Enter a valid full name.'; END IF;
  IF EXISTS (SELECT 1 FROM auth.users u WHERE lower(u.email)=v_email) THEN RAISE EXCEPTION 'An account already exists for this email. Please sign in.'; END IF;
  IF EXISTS (SELECT 1 FROM registration_orders r WHERE lower(r.email)=v_email AND r.status IN ('pending_payment','payment_verified') AND r.expires_at>now()) THEN RAISE EXCEPTION 'A registration payment is already in progress for this email.'; END IF;
  IF v_role='student' THEN SELECT * INTO v_course FROM courses WHERE id=p_course_id AND status='published'; IF NOT FOUND THEN RAISE EXCEPTION 'Select a published course.'; END IF; IF v_course.price<=0 THEN RAISE EXCEPTION 'Student registration requires a paid course.'; END IF; v_amount:=v_course.price; ELSE v_amount:=100.00; END IF;
  INSERT INTO registration_orders(registration_token_hash,role,email,full_name,referral_code,course_id,amount,currency) VALUES(encode(extensions.digest(v_token,'sha256'),'hex'),v_role,v_email,v_name,CASE WHEN p_referral_code ~* '^GILSE-[A-Z0-9]{8}$' THEN upper(trim(p_referral_code)) ELSE NULL END,p_course_id,v_amount,'USD') RETURNING * INTO v_order;
  RETURN jsonb_build_object('order_id',v_order.id,'registration_token',v_token,'role',v_role,'email',v_email,'amount',v_amount,'currency','USD','expires_at',v_order.expires_at,'course_id',p_course_id);
END;
$$;
REVOKE ALL ON FUNCTION private.create_registration_order(text,text,text,uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.create_registration_order(text,text,text,uuid,text) TO anon, authenticated;
DROP FUNCTION IF EXISTS public.create_registration_order(text,text,text,uuid,text);
CREATE OR REPLACE FUNCTION public.create_registration_order(p_role text,p_email text,p_full_name text,p_course_id uuid DEFAULT NULL,p_referral_code text DEFAULT NULL) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path = public, pg_catalog AS $$ SELECT private.create_registration_order($1,$2,$3,$4,$5); $$;
REVOKE ALL ON FUNCTION public.create_registration_order(text,text,text,uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_registration_order(text,text,text,uuid,text) TO anon, authenticated;
ALTER VIEW public.enrolled_lesson_content SET (security_invoker = true);
ALTER VIEW public.published_lesson_catalog SET (security_invoker = true);
ALTER VIEW public.certificate_verification SET (security_invoker = true);
