# WorkBridge — Demo Accounts

These accounts are created by `npm run seed` (in `server/`).
**Password for every account:** `Passw0rd!`

To (re)create this data:

```bash
cd server
npm run seed        # wipes, then fills the database with the accounts below
# npm run db:reset  # deletes ALL data
# npm run db:reseed # reset + seed
```

## Clients (3)

| Business | Email | Notes |
| --- | --- | --- |
| Nokshi Threads | `nokshi@demo.wb` | Has a delivered job, an active job, a matching job, and an open board task; payment methods (bKash, bank) |
| Chaap Ghor | `chaap@demo.wb` | Has a posted job whose AI trial awaits their check, a job in review, and an open dispute; Nagad payment method |
| Shopno Agro | `shopno@demo.wb` | Has a delivered job and a posted job whose AI trial awaits their check; bank payment method |

## Moderators (2)

| Name | Email | Notes |
| --- | --- | --- |
| Sabbir Rahman | `mod@demo.wb` | Platform coordinator |
| Rima Chowdhury | `mod2@demo.wb` | Platform coordinator |

Moderator queues after seeding: an AI shortlist to select from (packaging label — 2 students at 90%+, 1 kept back below the bar), new posts (oversight only), work to score, a KYC queue (2 students), an open dispute, and support tickets.

## Students (5)

| Name | Email | Verification | Notes |
| --- | --- | --- | --- |
| Nusrat Jahan | `nusrat@demo.wb` | ✅ Verified | Active task, a delivered task on record, earnings, trials, points |
| Tanvir Ahmed | `tanvir@demo.wb` | ✅ Verified | Delivered work + a submission in review, earnings |
| Afsana Mim | `afsana@demo.wb` | ✅ Verified | Applied to a matching task; involved in a dispute |
| Mehedi Hasan | `mehedi@demo.wb` | ⏳ Pending | In the moderator KYC queue; can browse but not apply until verified |
| Farzana Akter | `farzana@demo.wb` | ⏳ Pending | In the moderator KYC queue |

## Notes

- Verified students can apply to tasks; pending students must be verified by a moderator first (`mod@demo.wb` → Verify students).
- New moderators can only be self-registered with the `MODERATOR_SIGNUP_CODE` from `server/.env`; the two above are created directly by the seed.
- `.env` / `.env.local` hold real secrets and are git-ignored — rotate the DB password, `JWT_SECRET`, and Gemini key before any real deployment.
