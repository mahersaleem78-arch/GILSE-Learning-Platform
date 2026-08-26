CREATE OR REPLACE FUNCTION prevent_student_payment_mutation() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND get_current_user_role() NOT IN ('admin','developer') THEN
    IF NEW.student_id IS DISTINCT FROM OLD.student_id OR NEW.course_id IS DISTINCT FROM OLD.course_id OR NEW.amount IS DISTINCT FROM OLD.amount OR NEW.wallet_address IS DISTINCT FROM OLD.wallet_address OR NEW.status NOT IN ('pending','submitted') THEN
      RAISE EXCEPTION 'Payment fields can only be changed by the verification service.';
    END IF;
  END IF;
  RETURN NEW;
END; $$;
