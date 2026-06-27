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
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Additional variables for later phases:

```text
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
EXA_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

Never commit real `.env` files.

2. Install and run:

```bash
pnpm install
pnpm dev
```

## Supabase Auth

Google Auth is configured in the Supabase dashboard.

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

Deploy from this directory:

```bash
vercel --prod
```

Configure all environment variables in Vercel without committing secrets. When connecting GitHub, set the Vercel project root directory to `codebase`.
