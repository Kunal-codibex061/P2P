# Rentora V1 Prototype

Trusted P2P rental marketplace for high-value items.

Brand positioning: **"Rent big useful things from verified people near you."**

## Tech Stack

- Frontend: Next.js (App Router) + TypeScript + Tailwind + React Query
- Backend: Node.js + Express + TypeScript + Mongoose + Zod
- Database: MongoDB
- Infra: Docker + Docker Compose

## Product Scope Implemented

- Home, browse, category, listing detail, create listing
- Request flow with CTA conversion (`Request Item` -> `Chat`)
- Conversations with quick actions and system messages
- Renter dashboard + lender dashboard with booking lifecycle actions
- Profile/KYC mock flow (`not_started -> pending -> verified`)
- Admin panel for users/listings/requests + moderation + KYC update + reports placeholder
- Trust and safety banners + report placeholders
- Mock auth with seeded demo users (renter/lender/hybrid/admin)

## Data Model (Mongo)

- `User`
- `Listing`
- `RentalRequest`
- `Conversation` (embedded `messages`)

Indexes included for listing discovery and request/conversation lookups:
- listing `category`, `city`, `locality`, `ownerId`, `availabilityStatus`, `moderationStatus`
- request `listingId`, `renterId`, `lenderId`, `status`
- conversation `requestId` (unique), `renterId`, `lenderId`

## Seed Data Included

- 10 users
- 36 listings (6 major categories x 6 listings each)
- 14 rental requests across multiple statuses
- 12 conversations with realistic message history
- 2 curated Unsplash photos per listing (external-hosted URLs)

Includes sample listings such as:
- Canon 80D DSLR Camera Kit
- Sony Mirrorless Camera with Lens
- PS5 Console with Controller
- Epson Projector for Movie Nights
- JBL Party Speaker with Mic
- Ergonomic Office Chair
- Air Cooler for Monthly Rent
- Bosch Drill Machine
- Camping Tent for 4 People

## Listing Images (Web-Sourced)

- Listing photos are sourced from Unsplash search results and stored as external URLs in seed data.
- During seeding, the backend fetches Unsplash search results per listing query and picks top relevant photos (with fallback to curated/static images).
- Images are normalized with consistent transforms for quality/performance:
  - `?auto=format&fit=crop&w=1400&q=80`
- To regenerate curation suggestions:
  ```bash
  docker compose exec backend npm run curate:images
  ```
- After any image map updates, reseed:
  ```bash
  docker compose exec backend npm run seed
  ```

Provider and license references:
- [Unsplash](https://unsplash.com)
- [Unsplash License](https://unsplash.com/license)

## API Surface

- `GET /api/listings`
- `GET /api/listings/:id`
- `POST /api/listings`
- `PUT /api/listings/:id`
- `GET /api/categories`
- `GET /api/requests`
- `POST /api/requests`
- `PUT /api/requests/:id/status`
- `GET /api/conversations`
- `GET /api/conversations/:id`
- `POST /api/conversations/:id/messages`
- `GET /api/users/me`
- `PUT /api/users/me`
- `POST /api/kyc/mock/start`
- `POST /api/kyc/mock/verify`
- Admin routes:
  - `GET /api/admin/users`
  - `GET /api/admin/listings`
  - `GET /api/admin/requests`
  - `PUT /api/admin/listings/:id/moderation`
  - `PUT /api/admin/users/:id/kyc`
  - `GET /api/admin/reports`

## Local Run (Docker - one command)

1. From project root:
   ```bash
   docker compose up --build
   ```
2. Open:
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend health: [http://localhost:8080/health](http://localhost:8080/health)

Notes:
- `SEED_ON_START=true` seeds on first boot when DB is empty.
- To force reseed:
  ```bash
  docker compose exec backend npm run seed
  ```

## Environment Variables

Copy `.env.example` to `.env` (optional, compose has defaults).

```env
MONGO_URI=mongodb://mongodb:27017/rentora_v1
PORT=8080
JWT_SECRET=rentora-dev-secret
FRONTEND_URL=http://localhost:3000
SEED_ON_START=true
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

## Demo Flow Checklist

1. Login as renter (`/login`)
2. Browse listings and open detail
3. Send request
4. CTA turns into `Chat`
5. Send quick-action/custom message
6. Switch to lender user
7. Open lender dashboard and accept request
8. Move lifecycle: confirm pickup -> return pending -> completed
9. Verify renter dashboard updates

## What Is Mocked vs Real

Mocked:
- Authentication (demo user selection)
- Digio KYC integration (UI + local status transitions)
- Payments/deposit collection
- Reports/dispute resolution handling
- Push/SMS/email notifications
- Realtime chat websockets (uses periodic refetch)

Real in V1:
- Full Mongo-backed entities and API workflows
- Request creation + conversation linkage
- Status transition engine for booking lifecycle
- Admin moderation and KYC controls
- Listing CRUD and category-aware listing creation

## Suggested Production Next Steps

1. Real auth/authorization (JWT refresh, RBAC, device session management)
2. Digio KYC integration with webhook verification states
3. Escrow/deposit/payment rails and refund flows
4. Realtime chat + moderation + abuse controls
5. Secure image uploads with CDN + signed URLs
6. Notification pipeline (email/SMS/push/in-app)
7. Strong admin permissions/auditing
8. Full dispute + claims workflow
