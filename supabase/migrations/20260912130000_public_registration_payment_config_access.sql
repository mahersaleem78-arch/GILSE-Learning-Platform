/*
  Paid-first registration requires anonymous visitors to read only the
  payment destination fields needed to complete registration.
  The active flag is also readable because it is required to filter for the
  current configuration; admin-only fields remain inaccessible to anon.
*/

REVOKE ALL ON TABLE public.payment_config FROM anon;
GRANT SELECT (wallet_address, network, asset, qr_enabled, active)
  ON TABLE public.payment_config TO anon;

DROP POLICY IF EXISTS payment_config_anon_read ON public.payment_config;
CREATE POLICY payment_config_anon_read
  ON public.payment_config
  FOR SELECT
  TO anon
  USING (active = true);
