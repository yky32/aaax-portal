# AAAX portal

Operator UI for a **running AAAX jar**. Not the marketing site. Not served from the jar.

```text
browser  →  aaax-portal (:5173)
                 │  PKCE  ·  Bearer
                 ▼
            aaax jar (:8081)
```

Point it at any issuer. Configure what the HTTP APIs already expose.

Jar: [yky32/aaax](https://github.com/yky32/aaax) · Site: [aaax-www](https://aaax-www.vercel.app/)

---

## Run

Jar first (`AAAX_LOCAL_SEED=true`) on http://localhost:8081.

```bash
git clone https://github.com/yky32/aaax-portal.git
cd aaax-portal
npm install
npm run dev
```

Open **http://127.0.0.1:5173**. Sign in with PKCE (jar `/login`) or, on loopback only, password grant (`credentials=`).

Seed user: `smoke.primary@aaax.local` / `SmokePrimary!1`.

### Docker

From **aaax**, this repo cloned as `../aaax-portal`:

```bash
docker compose --profile stack -f docker-compose.yml -f compose.portal.yml up --build
```

Or this image alone (`5173:80` keeps seed PKCE redirects):

```bash
docker build -t aaax-portal .
docker run --rm -p 5173:80 aaax-portal
```

Widen `AAAX_CORS_ORIGINS` on the jar if the UI is not `localhost` / `127.0.0.1`.

---

## What it can do

Existing jar HTTP only. **403 on `/mgt` is normal** for the seed user — no bootstrap `ROLE_ADMIN`.

| Page | Calls |
|------|--------|
| Me | `GET /users/me` · `/users/my-roles` · probe `/mgt/users` |
| Users | list/register · patch status, username, credentials · auth logs · soft delete |
| RBAC | `/rbac-templates` · `POST /users/{id}/roles` (`admin` \| `normal`) |
| Clients | `GET/POST/PUT /clients/{id}` (no list-all) |
| System | `/system-configurations` · housekeeping |
| Try | OpenAPI catalog · swagger on the jar |

Does **not** edit `application.yml`, JKS, Postgres, or Docker.

---

## Auth

Public client **`aaax-portal`** (PKCE S256, no secret), seeded with the jar:

- `http://127.0.0.1:5173/callback`
- `http://localhost:5173/callback`
