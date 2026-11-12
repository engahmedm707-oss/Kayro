# Perfume Store (React + JavaScript + Supabase, $0 stack)

Free-tier perfume e-commerce app for Egypt (COD & Vodafone Cash with reference + screenshot), with owner/admin management, customer login, governorate-based shipping, discounts, and in-app + email notifications.

## Prerequisites (free)
- Node.js 18+
- A [Supabase](https://supabase.com/) free project
- (Optional, for email notifications) A free email provider account (e.g. [Resend](https://resend.com/) or [Brevo](https://www.brevo.com/)) and a Supabase Edge Function/secret configuration

## Setup
1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Configure environment**
   - Copy `.env.example` to `.env` and fill in your Supabase URL/anon key and store/Vodafone Cash details.
3. **Database & storage (Supabase)**
   - In the Supabase SQL editor, run the migration in `supabase/migrations/001_init.sql`.
   - Create a public storage bucket named `product-images` (or adjust code/policies accordingly).
   - Deploy/configure the notification email Edge Function if using email (see `supabase/functions/` notes in code/plan) and set required secrets.
4. **Create the first Owner**
   - Create a user in Supabase Auth (email/password), then insert a matching `profiles` row with `role = 'owner'` (see comments in `001_init.sql`). The owner can then create admin accounts from the Admin panel.
5. **Run locally**
   ```bash
   npm run dev
   ```
6. **Deploy ($0)**
   - Deploy the frontend to Vercel/Netlify/Cloudflare Pages (free). Set the same `VITE_*` environment variables in the host.

## Notes
- Service area: Egypt governorates (seeded; shipping fees adjustable by admin).
- Payments: Cash on Delivery and Vodafone Cash (manual verification via reference + screenshot).
- Taxes: not applied now, but totals/schema include `tax_amount` (default 0) for future use.
- Free-tier limits apply (DB/storage/bandwidth/email). SMS/WhatsApp not included at $0.
- Ensure RLS/policies and secrets are correctly configured before production use.
