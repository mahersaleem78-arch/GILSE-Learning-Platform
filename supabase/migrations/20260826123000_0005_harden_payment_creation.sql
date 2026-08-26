CREATE OR REPLACE FUNCTION prepare_payment_insert() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c record; cfg record;
BEGIN
  SELECT price,currency INTO c FROM courses WHERE id=NEW.course_id AND status='published';
  IF NOT FOUND THEN RAISE EXCEPTION 'Course is not available for payment.'; END IF;
  SELECT * INTO cfg FROM payment_config WHERE active=true ORDER BY updated_at DESC LIMIT 1;
  IF NOT FOUND OR cfg.wallet_address LIKE 'CONFIGURE_%' THEN RAISE EXCEPTION 'Payment wallet is not configured.'; END IF;
  NEW.amount := c.price;
  NEW.currency := COALESCE(c.currency,'USD');
  NEW.asset := cfg.asset;
  NEW.network := cfg.network;
  NEW.wallet_address := cfg.wallet_address;
  NEW.status := 'pending';
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS payments_prepare_insert ON payments;
CREATE TRIGGER payments_prepare_insert BEFORE INSERT ON payments FOR EACH ROW EXECUTE FUNCTION prepare_payment_insert();

CREATE OR REPLACE FUNCTION prevent_student_payment_mutation() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF get_current_user_role() NOT IN ('admin','developer') THEN
    IF NEW.student_id IS DISTINCT FROM OLD.student_id OR NEW.course_id IS DISTINCT FROM OLD.course_id OR NEW.amount IS DISTINCT FROM OLD.amount OR NEW.wallet_address IS DISTINCT FROM OLD.wallet_address OR NEW.status NOT IN ('pending','submitted') THEN
      RAISE EXCEPTION 'Payment fields can only be changed by the verification service.';
    END IF;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS payments_prevent_mutation ON payments;
CREATE TRIGGER payments_prevent_mutation BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION prevent_student_payment_mutation();
