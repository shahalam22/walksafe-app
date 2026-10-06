# WalkSafe app

The installable WalkSafe web app (PWA) for blind and low-vision pedestrians and their admins,
built with Next.js and published to GitHub Pages: https://shahalam22.github.io/walksafe-app/

- **Blind user:** one full-screen button. Tap anywhere to start, tap again or shake to stop;
  every instruction is spoken. A helper menu sets up the phone (camera, voice, install).
- **Admin:** session dashboard (stats, charts, speed profile, CSV export), accounts (add a user
  or another admin; new password, turn on/off, delete for users), the server address, and
  phone setup steps.
- **Forgot password:** after a wrong sign-in, **Forgot password?** emails a reset link that
  opens the **New password** page.

It talks to Supabase (sign-in, session data, the server address) and to the WalkSafe server on
Colab (guidance and account changes). See the main [WalkSafe](https://github.com/shahalam22/WalkSafe) repo.

## Develop

```bash
npm install
npm run dev          # http://localhost:3000
npm run lint
npm run typecheck
npm run build        # static site in out/
```

`.env` holds the Supabase URL and publishable key. Both are public (they end up in the page);
row level security in the database limits what a login can read. Put local overrides in
`.env.local`.

The camera needs HTTPS (or `localhost`), so test guidance on a phone through the deployed site
or an HTTPS tunnel.

## Deploy

Every push to `main` runs [.github/workflows/deploy.yml](.github/workflows/deploy.yml): lint,
type check, `next build` with `BASE_PATH=/walksafe-app`, and publish `out/` to GitHub Pages.
One-time setting: repo **Settings → Pages → Source: GitHub Actions**.

The site is a static export (`output: "export"`), so there is no server code: no API routes,
server actions or middleware. Everything runs in the browser.

## Layout

```
src/
  app/                    routes (each page is a thin server component)
    login/  reset-password/  guide/
    admin/                dashboard: sessions, session/?id=, users, server, setup
    layout.tsx            auth provider + gate, service worker
    manifest.ts  icon.svg  apple-icon.png
  components/
    auth/                 AuthProvider (login state), AuthGate (who may see which page), forms
    guide/                the guidance screen and helper menu
    admin/                dashboard pages
    charts/               bar chart, line chart, stat tiles
  hooks/useLoader.ts      load data in a component
  lib/                    no React: Supabase client, server API, guidance loop, speech, prefs
public/
  sw.js                   offline support
  icons/                  app icons
```

## Supabase settings for password reset

Authentication → URL Configuration: **Site URL** `https://shahalam22.github.io/walksafe-app/`, and
**Redirect URLs** must include `https://shahalam22.github.io/walksafe-app/**` (and
`http://localhost:3000/**` to try it locally).
