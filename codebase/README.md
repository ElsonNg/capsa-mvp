# Capsa App

Next.js app for the Capsa MVP.

## Local Setup

1. Copy the example env file and fill in local values:

```bash
cp .env.example .env
```

Required for Phase 1 auth:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Additional variables for later phases:

```text
SUPABASE_SECRET_KEY=
SUPABASE_JWKS_URL=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
EXA_API_KEY=
```

Never commit real `.env` files. `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is the browser-safe Supabase publishable key. `SUPABASE_SECRET_KEY` is server-only and must never be exposed in client code.

2. Install and run:

```bash
pnpm install
pnpm dev
```

## Supabase Auth

Google Auth is configured in the Supabase dashboard.

The Google OAuth client ID and client secret are pasted into Supabase, not into this Next.js app and not into Vercel. Supabase uses them server-side for the Google provider.

Use this Google Cloud authorized redirect URI:

```text
https://<project-ref>.supabase.co/auth/v1/callback
```

Use these Supabase redirect URLs:

```text
http://localhost:3000/auth/callback
https://<vercel-domain>/auth/callback
```

Set the Supabase Site URL to:

```text
http://localhost:3000
```

Then update it to the Vercel production URL after deployment.

## Supabase CLI

The initial migration lives in `supabase/migrations`.

If the Supabase CLI is blocked by telemetry writes in this environment, run it with a writable home:

```bash
HOME=/private/tmp/supabase-home supabase --version
```

After `NEXT_PUBLIC_SUPABASE_URL` is filled, derive the project ref from the URL and link:

```bash
supabase link --project-ref <project-ref>
```

Then apply migrations:

```bash
supabase db push
```

## Build

```bash
pnpm lint
pnpm build
```

The build script uses webpack because the default Next 16 Turbopack build hung in this local environment.

## Vercel

For Phase 1, set these Vercel environment variables:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=https://capsa-mvp.vercel.app
```

For later OpenAI, Exa, and server API work, also add:

```text
SUPABASE_SECRET_KEY=
SUPABASE_JWKS_URL=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
EXA_API_KEY=
```

Do not add Google OAuth client credentials to Vercel unless future code explicitly needs direct Google API calls outside Supabase Auth.

Deploy from the repository root when the Vercel project root directory is set to `codebase`:

```bash
vercel --prod
```

Configure all environment variables in Vercel without committing secrets. When connecting GitHub, set the Vercel project root directory to `codebase`.
