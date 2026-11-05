# Commitment Signing

A React and Material UI starter app for collecting multiple signatures on one commitment, then reviewing and printing them together.

## Run locally

```sh
npm install
npm run dev
```

The signing page captures an editable commitment statement and signer details, and accepts signatures using mouse, touch, or stylus input. After one or more signers have signed, a separate preview page displays the commitment statement above every captured signature. The preview can be printed.

## Shared Supabase signatures

1. Create a Supabase project.
2. Open the Supabase SQL Editor and run [`supabase/schema.sql`](supabase/schema.sql).
3. Copy `.env.example` to `.env` and enter the project URL and publishable key.
4. Restart the local development server.

For Netlify, add these variables under **Site configuration → Environment variables** and redeploy:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

The publishable key is intended for browser use. Never place a Supabase secret key or service-role key in a `VITE_` environment variable. The included SQL grants public visitors `SELECT`, `INSERT`, and `DELETE` access for this event; it does not grant update access.

When Supabase is configured, signatures are loaded from the shared database and new signatures appear on open preview pages through Supabase Realtime. Without the variables, the app falls back to browser-local storage and shows a warning.

## Evolis SIG100 integration

The current signature pad is an HTML canvas and does not communicate with an Evolis SIG100 directly. Direct device capture needs the Evolis-supported SDK/API and the appropriate local integration (for example, a desktop wrapper or local bridge service), depending on the SDK and deployment environment.

## Checks

```sh
npm run lint
npm run build
```
