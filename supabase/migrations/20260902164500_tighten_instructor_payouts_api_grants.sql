-- Least-privilege API grants for instructor payout records.
-- Payout rows are created by trusted server-side registration/payment flows,
-- while instructors and administrators only need controlled read/update access.
REVOKE ALL PRIVILEGES ON TABLE public.instructor_payouts FROM anon;
REVOKE TRIGGER, TRUNCATE, REFERENCES ON TABLE public.instructor_payouts FROM authenticated;
REVOKE INSERT, DELETE ON TABLE public.instructor_payouts FROM authenticated;
GRANT SELECT, UPDATE ON TABLE public.instructor_payouts TO authenticated;
