# RENTeasy Product Requirements Document

## 1. Product Summary
RENTeasy is a trusted peer-to-peer rental marketplace for useful local items such as cameras, tools, furniture, electronics, home appliances, event gear, and outdoor equipment. The product helps renters find nearby items for a date range and helps owners earn from items they already own.

The current product is a V1 marketplace prototype with real Mongo-backed listings, rental requests, conversations, dashboards, item-request flows, KYC mock states, admin moderation, and Docker-based deployment.

## 2. Goals
- Make renting feel faster and safer than buying for short-term needs.
- Let renters search by item, city, and rental dates from the first screen.
- Let lenders list items with enough photos, pricing, deposit, and trust details to reduce negotiation friction.
- Keep all discovery, request, chat, and status changes inside the app.
- Provide admin controls for users, listings, KYC status, and moderation.

## 3. Target Users
- Renters: people who need high-value or bulky items temporarily.
- Lenders: verified local users who want to earn from idle items.
- Admins: operators who review listings, users, KYC state, and reported issues.

## 4. Core User Journeys
- Renter discovery: land on homepage, set location/date/search intent, browse matching listings, inspect item details, request item, chat with lender.
- Lender listing: log in, create listing, upload required photos, set pricing/deposit/location/rules, respond to renter requests.
- Open request flow: renter posts what they need, lenders respond with listings or proposed offers, conversation starts after response.
- Booking lifecycle: requested -> chatting -> accepted -> confirmed -> active -> return pending -> completed.
- Trust flow: user views profile/KYC state, completes mock KYC, sees trust badges across listing and request surfaces.
- Admin flow: admin reviews users, listings, requests, KYC state, and moderation status.

## 5. Functional Requirements
- Search and filters must support query text, category, city, locality, price, condition, rent unit, delivery availability, verified owner, and category-specific specs.
- Rental intent must persist `q`, `city`, `startDate`, and `endDate` through local storage and URL params.
- Date-aware listing search must exclude listings with overlapping committed requests in `accepted`, `confirmed`, `active`, or `return_pending` status.
- Request creation must reject invalid date ranges, own-listing requests, duplicate open requests, and overlapping committed bookings.
- Listing creation must require core listing fields, at least one image, rent pricing, deposit, location, condition, and category/subcategory.
- Conversations must be created automatically after successful rental requests and item-request responses.
- Dashboards must show renter and lender booking states with valid lifecycle actions.
- Admin routes must remain protected by auth/role checks.

## 6. Non-Functional Requirements
- Frontend must pass `npm run lint` and `npm run build`.
- Backend must pass `npm run build`.
- Docker Compose build must produce working frontend and backend images.
- Production deployments must set real `JWT_SECRET`, `FRONTEND_URL`, `NEXT_PUBLIC_API_BASE_URL`, and `MONGO_URI`.
- MongoDB must not be publicly exposed in production security groups.
- UI must remain responsive across mobile and desktop, with readable button text and no overlapping hero/category content.

## 7. Current UX Direction
- Homepage uses an original Gear Orbit hero with generated rental gear artwork, a rental command navbar, and a four-item Deal Board preview.
- One navbar morphs from soft hero-integrated styling into a compact sticky top bar on scroll.
- Category browsing appears lower on the page as browse lanes, separate from the hero visual language.
- Request and search flows share the same rental date selector pattern.

## 8. API Surface
- `GET /api/listings`
- `GET /api/listings/facets`
- `GET /api/listings/:id`
- `POST /api/listings`
- `PUT /api/listings/:id`
- `GET /api/categories`
- `GET /api/requests`
- `POST /api/requests`
- `PUT /api/requests/:id/status`
- `GET /api/item-requests`
- `POST /api/item-requests`
- `GET /api/conversations`
- `GET /api/conversations/:id`
- `POST /api/conversations/:id/messages`
- `GET /api/users/me`
- `PUT /api/users/me`
- `POST /api/kyc/mock/start`
- `POST /api/kyc/mock/verify`
- Admin: users, listings, requests, reports, listing moderation, user KYC updates.

## 9. Launch Readiness Gaps
- Replace mock/demo auth with production authentication, password/session security, refresh flow, and RBAC hardening.
- Replace mock KYC with real provider integration and webhook verification.
- Add payments, escrow/deposit collection, refunds, cancellation policy, and payout handling.
- Add realtime chat or websocket updates.
- Replace browser `alert()` error handling with consistent toast/banner components.
- Add upload storage/CDN, image moderation, signed URLs, and file size/type enforcement.
- Add notification pipeline for request, chat, status, and admin events.
- Add rate limiting, request validation hardening, audit logs, and production observability.
- Add automated tests for booking overlap, status transitions, search filters, and critical UI flows.

## 10. Acceptance Criteria
- Renter can search by city/date/query and see only relevant listings.
- Renter can request an item with selected dates and is blocked from impossible/overlapping bookings.
- Lender can create listings and manage incoming requests.
- Deal Board shows four listing previews when at least four listings are available.
- Dark/primary buttons show white text and readable icons.
- Homepage has no SharePal-like copied category card row.
- Frontend lint/build, backend build, and Docker Compose build all pass.
