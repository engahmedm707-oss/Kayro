# Perfume E-commerce Website — Project Plan

## 1. Overview
Build a fully functional, ready-to-use online perfume store for **Egypt** using **React and JavaScript**, with a goal of delivering the project at **$0 cost** (using free tiers and free subdomains).

## 2. Requirements (confirmed)

### Platform & access
- **Frontend:** React and JavaScript.
- **Administrators:** Multiple administrators supported.
- **Admin account creation:** Admin email accounts are created by the **site owner** (no public admin signup).
- **Admin login:** Secure login via email/password.
- **Customer login:** Customers **must log in** to make a purchase.

### Commerce scope
- **Service area:** Limited to **Egypt**.
- **Payment methods:** **Cash on Delivery (COD)** and **Vodafone Cash**.
- **Shipping:** Shipping fees set by the administrator **per governorate** and must be adjustable.
- **Taxes:** Not currently applicable, but the system must be designed to accommodate taxes in the future.
- **Notifications:** Required (events for orders/payment/status updates).

### Required customer information (checkout/profile)
- Name
- Phone number
- Email
- Address
- City
- Governorate (Egypt)

### Product (fragrance) details
- Brand
- Description
- Images
- Size/capacity options
- Fragrance notes
- Category/gender
- Stock quantity

### Discounts
- Support **percentage** and **fixed amount** discounts.
- Must be possible to list products/variants **without any discount**.

### Budget constraint
- **Completely free of charge**: no paid hosting, domain, database, storage, or notification services (use free tiers/subdomains and stay within quotas).

## 3. $0 (free-tier) strategy and constraints

### Recommended $0 stack
| Layer | Choice (free) | Purpose |
|---|---|---|
| Frontend | **React + JavaScript (Vite)** on **Vercel / Netlify / Cloudflare Pages** (free) | SPA hosting, HTTPS, free provider subdomain (`*.vercel.app` / `*.netlify.app` / `*.pages.dev`) |
| Backend + Database | **Supabase (free tier)** — PostgreSQL, Auth, Storage, Edge Functions | Auth/RBAC, data storage, file storage, secure owner/admin actions without paid server |
| Product images | **Supabase Storage** (free quota) | Upload/serve fragrance images |
| Notifications | **In-app notifications** (DB) + **email** via free tier (e.g. **Resend** or **Brevo**, limited volume) | Order/payment/status alerts within free limits |
| Payments | **COD** + **Vodafone Cash (manual confirmation)** | No gateway fees; VC via instructions + customer reference + admin verification |
| Region/shipping data | Egypt governorates **seeded in DB** (admin-editable fees) | No paid maps/geocoding API |

> **Architecture note:** The UI is React+JS. Supabase is accessed with the JavaScript client; privileged operations (e.g. owner creating admin accounts) should run in a secure **Edge Function** (server-side) so service-role secrets are not exposed to the browser.  
> **Alternative:** React + **Node.js/Express** API on a free host (e.g. Render) + free Postgres (Supabase/Neon) — also $0, but expect cold starts/sleep delays on free compute.

### Free-tier limitations to accept
- **No custom paid domain:** use a free provider subdomain unless a domain is already owned.
- **Quotas:** database size, storage, bandwidth, and email-send limits apply.
- **Reliability:** some free services may sleep, cold-start, or pause projects on inactivity (policy-dependent).
- **Notifications:** **SMS/WhatsApp are typically not free** in Egypt; at $0 plan for **in-app + email** notifications (SMS/WhatsApp as future paid add-on).
- **Backups/ops:** limited to what free tiers provide; include manual export/backup steps.

## 4. Roles, authentication, and security

### Roles
- **Owner:** highest privilege; creates/manages admin accounts; full access to settings, catalog, shipping, orders.
- **Admin:** manages catalog, discounts, governorate shipping fees, orders, and payment/order statuses (as permitted).
- **Customer:** registers/logs in; can browse/purchase (logged-in required) and view own orders/profile.

### Account & auth rules
- **Admin accounts:** created only by the owner (owner-only action creates auth user + assigns `admin` role). No public admin registration.
- **Customer accounts:** public registration with email/password; email verification recommended.
- **Session security:** secure password hashing (handled by auth provider), protected routes, role-based access control (RBAC) enforced server-side (RLS/policies or API guards).

### Security baseline
- Input validation and sanitization on client and server.
- Rate limiting/throttling on auth and sensitive endpoints where supported.
- Secrets stored in environment variables (never in client bundle); service-role keys only in server/edge context.
- Prevent overselling with transactional/atomic stock updates.

## 5. Functional design

### 5.1 Product catalog & variants
- **Product (fragrance):** `brand`, `name`, `description`, `fragranceNotes` (e.g. top/middle/base or structured text), `category`, `gender`, `images[]`, `isActive`.
- **Size/capacity options (variants):** each product has one or more variants with `sizeCapacity` (e.g. 50ml/100ml), `sku` (optional), `price`, `stockQuantity`, `isActive`.
  - *Recommended:* variants carry their own price and stock to accurately represent size options.

### 5.2 Discounts
- Applied per variant (or consistently per product, to be finalized): `discountType = none | percentage | fixed`, `discountValue`.
- **Validation:** percentage in [0,100]; fixed >= 0 and <= price; `none`/empty = no discount.
- **Pricing:** a single shared utility computes effective unit price/discount used in catalog, cart, checkout, and order snapshots.

### 5.3 Shipping (Egypt governorates)
- **GovernorateShipping** records: Egypt governorates seeded with admin-editable `shippingFee` and `isActive/available`.
- Checkout restricted to Egypt and to available governorates; shipping fee auto-applied from selected governorate.
- Admin can adjust fees anytime; existing orders keep snapshotted shipping fees.

### 5.4 Cart, checkout, and payments
- **Login required** to complete purchase.
- **Required checkout fields:** `name`, `phoneNumber`, `email`, `address`, `city`, `governorate` (with Egypt phone/governorate validation).
- **Totals:** `subtotal`, `discountTotal`, `shippingFee`, `taxAmount` (default 0), `total`.
- **Cash on Delivery (COD):** `paymentMethod=cod`, `paymentStatus` set to pay-on-delivery/pending as defined; fulfillment tracked via order status.
- **Vodafone Cash (manual):** checkout displays store VC number/instructions; customer submits `vodafoneRef` (transaction/reference number) and optional note/proof; `paymentStatus=awaiting_verification`; admin verifies receipt then marks paid/confirmed.

### 5.5 Taxes (future-ready)
- Include `taxRate`/`taxAmount` (default 0) in pricing config and order records.
- Centralized total calculation so taxes can be enabled later without changing order-history structure.

### 5.6 Orders
- **Lifecycle (example):** `pending` → `confirmed/payment_verified` → `processing` → `shipped` → `delivered`, with `cancelled` (and `returned` if needed).
- **Immutable snapshots:** store product/variant name, size, unit price, discount, shipping fee, tax, and totals at purchase time.
- **Stock:** decrement on order placement within a transaction; define restore-on-cancel behavior (to confirm).
- **Customer:** view own order history and status.
- **Admin/owner:** list/search/filter orders, view full details (items + customer info), update order/payment status.

### 5.7 Notifications
- **Events (minimum):** new order placed (to admin/owner), Vodafone Cash awaiting verification (to admin/owner), order received/confirmed and status updates (to customer).
- **Channels ($0):** in-app notification records/views + email via free-tier provider; adapter-based design to allow future SMS/WhatsApp.
- **Reliability basics:** persist notification records and send status (sent/failed) with simple retry/logging as feasible.

## 6. Proposed data model

- **User/Profile:** `id, role (owner|admin|customer), name, email, phone, password/auth-ref, isActive, createdAt`
- **CustomerAddress/Profile fields:** `userId, name, phone, email, address, city, governorateId` (and/or stored on order snapshot)
- **Product:** `id, brand, name, description, fragranceNotes, category, gender, images[], isActive, createdAt`
- **ProductVariant:** `id, productId, sizeCapacity, price, stockQuantity, discountType, discountValue, isActive`
- **GovernorateShipping:** `id, name, shippingFee, isActive` (Egypt governorates, admin-adjustable)
- **Order:** `id, userId, status, paymentMethod (cod|vodafone_cash), paymentStatus, customerSnapshot(name,phone,email,address,city,governorate), subtotal, discountTotal, shippingFee, taxAmount, total, vodafoneRef, notes, createdAt`
- **OrderItem:** `id, orderId, productId, variantId, productSnapshot, unitPrice, discountSnapshot, quantity, lineTotal`
- **Notification:** `id, targetUserId/targetRole, type, channel (in_app|email), payload, readAt/sentStatus, createdAt`

## 7. Frontend structure (high level)

- **Public/Auth:** `/login`, `/register`, `/forgot-password`, `/reset-password`
- **Customer (authenticated):** `/` catalog, `/products/:id` detail (variant/size, pricing/discount), `/cart`, `/checkout`, `/orders`, `/orders/:id`, `/profile`
- **Admin/Owner:** `/admin` dashboard, `/admin/products` (+ create/edit, variants, images), `/admin/shipping` (governorate fees), `/admin/orders` (+ detail/status/payment updates), `/admin/admins` (owner-only admin management)
- **Shared:** protected/role-based routes, layout/navigation, form validation, loading/empty/error states, responsive UI, toast/in-app notifications.

## 8. Delivery phases

1. **Foundation**
   - Initialize React (Vite, JS) app and Supabase project/config.
   - DB schema, migrations, and Egypt governorate seed.
   - Auth (register/login/logout), RBAC, owner bootstrap, owner-only admin-creation flow.
2. **Admin catalog & shipping**
   - Product and variant CRUD, image upload to storage.
   - Discount and stock management.
   - Governorate shipping fee management UI/API.
3. **Storefront & cart**
   - Catalog/listing and product detail with variant selection.
   - Discount-aware pricing display, cart management.
   - Authenticated checkout with required Egypt customer fields and governorate-based shipping.
4. **Orders & payments**
   - Order placement with snapshots and transactional stock decrement.
   - COD and Vodafone Cash (reference + awaiting verification) flows.
   - Admin order list/detail with status and payment updates; customer order history.
5. **Notifications**
   - In-app notification records and UI.
   - Email notifications for required events via free-tier provider; handle send status/quota failures gracefully.
6. **Hardening & $0 launch**
   - Validation, RBAC/policy/security review, and abuse/rate-limit considerations.
   - Responsive/UI polish, error handling, basic SEO/meta.
   - Tax-ready totals verification.
   - Deploy frontend to free host + configure env/secrets.
   - Runbook: environment setup, owner/admin creation, backups/exports, and free-tier limits.

## 9. Open decisions to finalize implementation spec

1. **Backend approach:** Confirm **Supabase (BaaS, free)** vs **Node.js + Express + free Postgres** (with possible cold starts).
2. **Vodafone Cash flow:** Collect **transaction/reference number** and/or **payment screenshot upload**? Exact VC number/instructions to display?
3. **Notification channels:** Confirm **in-app + email** only for $0 launch (SMS/WhatsApp deferred as paid), or different requirement?
4. **Owner bootstrap:** First owner created via **secure one-time setup (script/env with service key)** or a **first-run setup screen**?
5. **Variant pricing/stock:** Each size/capacity has its **own price and stock** (recommended) — confirm.
6. **Order admin actions:** Can admins **cancel/edit orders** and should stock be **restored on cancellation**?
7. **Branding/content:** Store name, logo/colors, and whether to seed placeholder/sample products/images.

---
*This document is a planning artifact. Implementation should proceed only after switching out of Plan mode and confirming the open decisions above.*
