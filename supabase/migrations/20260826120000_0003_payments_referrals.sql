/* GILSE payment + referral system: USDT/TRON, admin approval for rewards. */

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES profiles(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code) WHERE referral_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON profiles(referred_by);

CREATE TABLE IF NOT EXISTS payment_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset text NOT NULL DEFAULT 'USDT',
  network text NOT NULL DEFAULT 'TRON',
  wallet_address text NOT NULL,
  wallet_name text NOT NULL DEFAULT 'Binance',
  usdt_contract text,
  qr_enabled boolean NOT NULL DEFAULT true,
  reward_amount numeric(12,2) NOT NULL DEFAULT 40,
  active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'USD',
  asset text NOT NULL DEFAULT 'USDT',
  network text NOT NULL DEFAULT 'TRON',
  wallet_address text NOT NULL,
  tx_hash text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','submitted','verified','failed','cancelled')),
  verification_error text,
  referral_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_tx_hash ON payments(tx_hash) WHERE tx_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

CREATE TABLE IF NOT EXISTS referral_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  payment_id uuid NOT NULL UNIQUE REFERENCES payments(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL DEFAULT 40,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('pending_approval','approved','paid','rejected')),
  admin_note text,
  approved_by uuid REFERENCES profiles(id),
  approved_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rewards_status ON referral_rewards(status);

CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION update_payment_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at=now(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS payments_updated_at ON payments;
CREATE TRIGGER payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_payment_updated_at();

CREATE OR REPLACE FUNCTION generate_referral_code(uid uuid) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT 'GILSE-' || upper(substr(replace(uid::text,'-',''),1,8));
$$;

-- Rebuild signup trigger so every student gets a unique referral code and an optional referrer from signup metadata.
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE referrer uuid;
BEGIN
  IF NEW.raw_user_meta_data ? 'referral_code' THEN
    SELECT id INTO referrer FROM profiles WHERE referral_code = upper(trim(NEW.raw_user_meta_data ->> 'referral_code')) LIMIT 1;
  END IF;
  INSERT INTO profiles (id,email,full_name,role,status,referral_code,referred_by)
  VALUES (NEW.id,NEW.email,COALESCE(NEW.raw_user_meta_data->>'full_name',NULL),'student','active',generate_referral_code(NEW.id),CASE WHEN referrer=NEW.id THEN NULL ELSE referrer END);
  RETURN NEW;
END; $$;

-- Seed one configuration row only if none exists. Replace wallet_address before production use.
INSERT INTO payment_config (wallet_address, wallet_name, usdt_contract)
SELECT 'CONFIGURE_BINANCE_USDT_TRON_ADDRESS', 'Binance', NULL
WHERE NOT EXISTS (SELECT 1 FROM payment_config);

ALTER TABLE payment_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS payment_config_read ON payment_config;
CREATE POLICY payment_config_read ON payment_config FOR SELECT TO authenticated USING (active OR get_current_user_role() IN ('admin','developer'));
DROP POLICY IF EXISTS payment_config_admin_write ON payment_config;
CREATE POLICY payment_config_admin_write ON payment_config FOR ALL TO authenticated USING (get_current_user_role() IN ('admin','developer')) WITH CHECK (get_current_user_role() IN ('admin','developer'));

DROP POLICY IF EXISTS payments_student_read ON payments;
CREATE POLICY payments_student_read ON payments FOR SELECT TO authenticated USING (student_id=auth.uid() OR get_current_user_role() IN ('admin','developer'));
DROP POLICY IF EXISTS payments_student_insert ON payments;
CREATE POLICY payments_student_insert ON payments FOR INSERT TO authenticated WITH CHECK (student_id=auth.uid());
DROP POLICY IF EXISTS payments_admin_update ON payments;
CREATE POLICY payments_admin_update ON payments FOR UPDATE TO authenticated USING (get_current_user_role() IN ('admin','developer')) WITH CHECK (get_current_user_role() IN ('admin','developer'));

DROP POLICY IF EXISTS rewards_read ON referral_rewards;
CREATE POLICY rewards_read ON referral_rewards FOR SELECT TO authenticated USING (referrer_id=auth.uid() OR referred_student_id=auth.uid() OR get_current_user_role() IN ('admin','developer'));
DROP POLICY IF EXISTS rewards_admin_update ON referral_rewards;
CREATE POLICY rewards_admin_update ON referral_rewards FOR UPDATE TO authenticated USING (get_current_user_role() IN ('admin','developer')) WITH CHECK (get_current_user_role() IN ('admin','developer'));

DROP POLICY IF EXISTS audit_admin_read ON audit_log;
CREATE POLICY audit_admin_read ON audit_log FOR SELECT TO authenticated USING (get_current_user_role() IN ('admin','developer'));
DROP POLICY IF EXISTS audit_admin_insert ON audit_log;
CREATE POLICY audit_admin_insert ON audit_log FOR INSERT TO authenticated WITH CHECK (get_current_user_role() IN ('admin','developer'));

GRANT SELECT ON payment_config TO authenticated;
GRANT SELECT,INSERT,UPDATE ON payments TO authenticated;
GRANT SELECT,UPDATE ON referral_rewards TO authenticated;
GRANT SELECT,INSERT ON audit_log TO authenticated;
