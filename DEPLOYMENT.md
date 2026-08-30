# ShulSign deployment

This repository is the independently hosted ShulSign application.

## Vercel

1. Import this GitHub repository into Vercel.
2. Keep the detected framework as **Next.js**.
3. Add `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` for Production, Preview and Development.
4. Deploy.

Never add the database password or a `service_role` key to Vercel or GitHub.

## Supabase authentication URLs

After Vercel supplies the production URL, add it in Supabase under Authentication → URL Configuration as the Site URL and add `https://your-domain.example/**` as a Redirect URL.

## Routes

- `/` — application home
- `/admin` — Supabase-backed administrator sign-in
- `/display/mizmor-ledavid` — public display route

The original Base44 application is separate and is not changed by this deployment.
