# Deployment Plan: Frontend on Amplify, Backend on Lightsail

This runbook maps the current repo to the architecture requested by management:

- Frontend (`frontend`) -> AWS Amplify Hosting
- Backend (`backend`) -> AWS Lightsail (instance or container service)
- Database -> MongoDB Atlas

## 1) Target Architecture

- Amplify hosts Next.js frontend and provides public URL/domain.
- Lightsail hosts Express backend on port `8080`.
- Atlas hosts MongoDB cluster.
- Frontend calls backend using `NEXT_PUBLIC_API_BASE_URL=https://api.<domain>`.

## 2) Important Compatibility Check First

Current frontend uses `next@16.2.4` (`frontend/package.json`).

As of April 28, 2026, AWS Amplify docs state managed SSR support up to Next.js 15.
If Amplify build fails for Next.js 16, choose one path:

1. Fastest: downgrade frontend to Next.js 15 for first production rollout.
2. Keep Next.js 16 and use another host for frontend SSR until Amplify adds support.

Do this validation early to avoid surprise during release.

## 3) Environment Variables (What goes where)

Use templates already added:

- Backend template: `backend/.env.production.example`
- Frontend template: `frontend/.env.production.example`

### Backend (Lightsail)

Required:

- `NODE_ENV=production`
- `PORT=8080`
- `MONGO_URI=mongodb+srv://...` (Atlas link)
- `JWT_SECRET=<long-random-secret>`
- `FRONTEND_URL=https://<amplify-domain>[,https://www.<domain>]`
- `SEED_ON_START=false`
- `FIREBASE_WEB_API_KEY=...`

### Frontend (Amplify)

Required:

- `NEXT_PUBLIC_API_BASE_URL=https://api.<your-domain>`
- `NEXT_PUBLIC_FIREBASE_*` values

Note: `NEXT_PUBLIC_*` values are public and bundled into frontend assets.

## 4) MongoDB Atlas Setup

1. Create Atlas project and cluster.
2. Create DB user and password.
3. Network access:
   - For quick demo: allow `0.0.0.0/0` temporarily.
   - For production: allow only Lightsail egress IP.
4. Copy Atlas connection string and set in backend `MONGO_URI`.
5. In URI, ensure DB name is `rentora_v1` (or your chosen production DB name).

## 5) Frontend Deployment on Amplify

1. Push repo to GitHub/GitLab/Bitbucket.
2. In Amplify, create app from repo.
3. Configure app root as `frontend` (monorepo setup).
4. Build command: `npm run build`.
5. Output directory: `.next`.
6. Add frontend env vars from `frontend/.env.production.example`.
7. Deploy and verify:
   - `/` loads
   - Login page loads
   - API calls point to backend URL

## 6) Backend Deployment on Lightsail

Use one of these methods:

1. Lightsail instance (recommended for your current setup and "internal server" wording).
2. Lightsail container service (if your infra team prefers container-only ops).

### 6A) Lightsail Instance Method

1. Create Linux instance (Ubuntu LTS).
2. Attach static IP.
3. Open firewall ports: `22`, `80`, `443`, `8080` (or only `80/443` if using reverse proxy).
4. Install Docker + Docker Compose.
5. Clone repo on instance.
6. Create `backend/.env.production` using template.
7. Start backend container from `backend/Dockerfile`:
   - Map host `8080 -> container 8080`.
8. Optional but recommended:
   - Put Nginx in front on `80/443`.
   - Route `/` to backend `localhost:8080`.
   - Add HTTPS certificate.

### 6B) Lightsail Container Service Method

1. Build backend image locally or in CI.
2. Push image to Lightsail container service or public registry.
3. Create deployment with container env vars from backend template.
4. Expose public endpoint on `8080` and health check path `/health`.

## 7) CORS and Domain Wiring

- Set backend `FRONTEND_URL` to exact Amplify domain(s), comma-separated if multiple.
- Set frontend `NEXT_PUBLIC_API_BASE_URL` to backend public domain.
- If using custom domains:
  - `app.example.com` -> Amplify
  - `api.example.com` -> Lightsail backend

## 8) What to Change in Current Code Before Production Cutover

1. Remove hardcoded fallback secrets/keys in code:
   - `backend/src/routes/auth.ts`
   - `backend/src/middleware/auth.ts`
   - `backend/src/utils/firebaseAuth.ts`
2. Remove localhost fallbacks for production runtime:
   - `backend/src/server.ts`
   - `frontend/src/lib/config.ts`
3. Ensure `SEED_ON_START=false` in production.
4. Add production logging/monitoring and rate-limit middleware.

## 9) How to Test Without Real Company AWS Access (Demo Accounts)

Use two short-lived demo accounts/projects:

1. Demo Amplify account for frontend.
2. Demo Lightsail account for backend.

Then run this test ladder:

1. Local production simulation:
   - Backend: `NODE_ENV=production npm run build && npm run start`
   - Frontend: `npm run build && npm run start`
2. Atlas integration test:
   - Verify backend `/health`.
   - Create/read listing via API.
3. Cross-origin test:
   - From Amplify frontend, login and call protected backend endpoint.
4. End-to-end user flow:
   - Firebase login
   - Browse listings
   - Create request
   - Open chat
5. Restart test:
   - Restart backend service and verify no data loss, no seed run.
6. Negative tests:
   - Wrong JWT -> `401`
   - Blocked origin -> CORS failure
   - Atlas blocked IP -> backend startup failure (expected)

## 10) Go-Live Checklist

- [ ] Amplify build is green on release branch.
- [ ] Backend health endpoint publicly reachable.
- [ ] Atlas whitelist tightened to only required IPs.
- [ ] `SEED_ON_START=false` verified.
- [ ] JWT secret rotated and stored securely.
- [ ] DNS + SSL configured for app and API domains.
- [ ] Smoke test after deployment passed.

---

References:

- AWS Amplify Next.js SSR support and deploy docs
- AWS Amplify environment variables docs
- AWS Lightsail Node.js and container deployment docs
- AWS Lightsail health checks and static IP docs
