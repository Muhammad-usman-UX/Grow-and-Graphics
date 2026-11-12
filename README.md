# Grow & Graphics (Next.js + Supabase + Vercel)

Complete build: public site, free-launch shop, 4-product order flow, AI generation (mock / Gemini / OpenAI),
admin review, client review and delivery, reviews + Google review flow, paused email.

## 1. Run locally
1. Install Node.js 20+, then `npm install`
2. Copy `.env.example` to `.env.local`
3. Supabase: create a free project. Put the Project URL, anon key and service role key in `.env.local`.
4. Supabase > SQL Editor: paste and run `supabase/schema.sql` (safe to run again).
5. Supabase > Authentication > Users > Add user: your admin email + a password (tick "auto confirm").
   Put the same email in `ADMIN_EMAIL`.
6. `npm run dev`, open http://localhost:3000. Admin is at /admin.

Leave `IMAGE_PROVIDER=mock` and `TEXT_PROVIDER=mock` to test the whole flow for free with placeholder images.

## 2. Go real later (no code changes)
- Images: `IMAGE_PROVIDER=gemini` or `openai`, and `IMAGE_API_KEY=...`
- Audit text: `TEXT_PROVIDER=gemini` (or `openai`) and `TEXT_API_KEY=...`
- Email: `RESEND_API_KEY=...` (+ `EMAIL_FROM` once you verify a domain). Until then clients are notified on their order page only.
- After changing env variables on Vercel, click Redeploy.

## 3. Deploy
Push to GitHub, import in Vercel, add the same env variables, deploy. Then in Supabase > Authentication > URL
Configuration set Site URL to your Vercel address. Set `NEXT_PUBLIC_SITE_URL` to it as well.
The daily follow-up email job is in `vercel.json`; it needs `CRON_SECRET` (any long random text).

## 4. Test checklist (use mock mode first)
1. Shop > Get It Free > Step 1 > Step 2 > submit empty (must show errors) > fill > submit.
2. /admin: the order is "Draft Ready for Admin Review". The client page /order/<id> shows NO draft yet.
3. Approve: the draft now shows on /order/<id>. Repeat for all 4 products (both Instagram sizes).
4. Admin: Needs Work (note required) and Improve It regenerate and come back to admin, not the client.
5. Client: Request Changes works twice, a third attempt is refused. Approve > Delivered > downloads + review form.
6. Review: 5 stars shows the Google button, 3 stars shows only the private feedback box. Approve it in /admin/reviews.
7. Check every page on the live Vercel URL.

## Notes
- Home/services images load from the old Lovable site. Download them into `public/` and edit `lib/site.ts` before you close that site.
- Mock images draw text with system fonts; on Vercel they may show boxes instead of letters. Real providers are not affected.
- Uploads are limited to 3 MB (Vercel request limit). Admin manual upload: 4 MB.
- Client downloads unlock only after the client approves (status Delivered).
- Admin regenerations are not limited; client revision requests are limited to 2.
