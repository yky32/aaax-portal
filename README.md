# AAAX portal

Operator UI for a running **AAAX** jar. Not the marketing site ([aaax-www](https://github.com/yky32/aaax-www)). Not served from the jar.

```text
browser  →  aaax-portal (:5173)
                │  PKCE client aaax-portal + Bearer
                ▼
           aaax jar (:8081 / your issuer)
```

## Run

Jar first (`AAAX_LOCAL_SEED=true`) on http://localhost:8081.

```bash
git clone https://github.com/yky32/aaax-portal.git
cd aaax-portal
npm install
npm run dev
```

Open http://127.0.0.1:5173 — Sign in with PKCE (hosted `/login` on the jar) or, on loopback only, password grant (`credentials=`).

Seed user: `smoke.primary@aaax.local` / `SmokePrimary!1`.

CORS on the jar already allows `http://localhost:*` and `http://127.0.0.1:*`. Widen `AAAX_CORS_ORIGINS` if you host this UI elsewhere.

## What it configures

Existing HTTP only: clients (`GET/POST/PUT /clients/{id}` — no list-all), `/mgt/users`, `/system-configurations`, housekeeping, `/users/me`, OpenAPI catalog.

It does **not** edit `application.yml`, JKS, Postgres URL, or Docker.

## Auth

Public client **`aaax-portal`** (PKCE S256, no secret). Redirects:

- `http://127.0.0.1:5173/callback`
- `http://localhost:5173/callback`

Seeded when `AAAX_LOCAL_SEED=true` on the jar.
