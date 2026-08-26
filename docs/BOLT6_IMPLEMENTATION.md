# Bolt #6 — Payment and Referral Implementation

## Scope

Bolt #6 implements the student USDT/TRON payment flow, server-side transaction verification, paid-course enrollment protection, referral attribution, referral rewards, and administrator payment/reward views.

## Current implementation

- Payment configuration and payment request schema in Supabase.
- Student payment page at `/courses/:id/pay`.
- Paid courses route to the payment flow.
- Transaction hashes are sent directly to the trusted `verify-tron-payment` Edge Function rather than being written by the student client.
- Edge Function validates authenticated ownership, confirmed TRON transfer, destination wallet, USDT contract, and required amount, and searches multiple TronGrid pages.
- Verified payment activates the matching enrollment and can create one referral reward.
- Referral codes are captured from `?ref=` and passed through signup/payment metadata.
- Referral rewards are administrator-controlled with explicit status transitions.
- Database hardening prevents self-referrals and prevents paid-course enrollment without a verified payment.
- Admin payment filtering and reward workflow are available under `/admin/payments` and `/admin/rewards`.

## Remaining operational steps

1. Apply migration `20260826130000_0007_harden_enrollment_referrals.sql` to the connected production Supabase database.
2. Ensure `payment_config.wallet_address` and `usdt_contract` are configured with the real production values.
3. Deploy the updated `verify-tron-payment` Edge Function after this commit.
4. Run `npm install`, `npm test`, `npm run build`, and `npm run lint` in a clean checkout.
5. Add integration tests against a controlled/staging Supabase project before production payment activation.
