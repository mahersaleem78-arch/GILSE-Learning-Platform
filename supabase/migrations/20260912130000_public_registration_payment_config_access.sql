/*
  Paid-first registration requires anonymous visitors to read only the
  non-sensitive payment destination fields needed to complete registration.
  Keep admin-only configuration fields (reward amount, active metadata,
  update actor, etc.) inaccessible to anon.
*/

REVOKE ALL ON TABLE public.payment_config FROM anon;
GRANT SELECT (wallet_address, network, asset, qr_enabled)
  ON TABLE public.payment_config TO anon;

DROP POLICY IF EXISTS payment_config_anon_read ON public.payment_config;
CREATE POLICY payment_config_anon_read
  ON public.payment_config
  FOR SELECT
  TO anon
  USING (active = true);
