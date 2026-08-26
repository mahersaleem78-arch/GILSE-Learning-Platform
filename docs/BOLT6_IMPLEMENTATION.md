# Bolt #6 — Payment and Referral Implementation

## Scope

Bolt #6 implements the student USDT/TRON payment flow, server-side transaction verification, paid-course enrollment protection, immutable referral attribution, referral rewards, and administrator payment/reward views.

## Current implementation

- Payment configuration and payment request schema in Supabase.
- Student payment page at `/courses/:id/pay`.
- Paid courses route to the payment flow instead of direct enrollment.
- Payment creation derives course price, payment configuration, and referral attribution from the database; the browser does not control these values.
- Transaction hashes are sent directly to the trusted `verify-tron-payment` Edge Function rather than being written by the student client.
- Edge Function validates authenticated ownership, confirmed TRON transfer, destination wallet, USDT contract, and exact required amount, and searches multiple TronGrid pages.
- Verified payment activates the matching enrollment and can create one referral reward.
- Referral codes are captured from `?ref=` at signup and stored as immutable account attribution.
- Referral rewards are administrator-controlled with explicit status transitions.
- Database hardening prevents self-referrals, prevents changing referral attribution after signup, prevents changing payment referral attribution, and prevents paid-course enrollment without a verified payment.
- Additional integrity protection prevents duplicate verified payments for the same student/course and self-referral reward rows.
- Admin payment filtering and reward workflow are available under `/admin/payments` and `/admin/rewards`.

## Remaining operational steps

1. Apply migrations `20260826130000_0007_harden_referral_and_enrollment.sql`, `20260826141000_0008_harden_function_execution.sql`, `20260826150000_0009_fix_referral_payment_attribution.sql`, and `20260826193000_0010_payment_referral_integrity.sql` to the connected production Supabase database, in order.
2. Ensure `payment_config.wallet_address` and `usdt_contract` are configured with the real production values.
3. Deploy the current `verify-tron-payment` Edge Function after the repository changes are applied.
4. Run `npm install`, `npm test`, `npm run build`, and `npm run lint` in a clean checkout.
5. Add integration tests against a controlled/staging Supabase project before production payment activation.

## Important verification note

GitHub contains the complete migration and Edge Function source, but repository access alone does not prove that the latest migrations have been applied to the live Supabase project or that the latest Edge Function has been deployed there. Those operational states must be verified separately before production activation.
