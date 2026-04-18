# Kanto Invoice — Development Walkthrough

This document tracks all major feature implementations across the Invoice Managerium project.

---

## Phase 0 — Registration & Shop Setup Flow

### Changes
- **`Register.tsx`** — After account creation, auto-logs in the user (saves session) and redirects to `/shop-setup` instead of email verification
- **`user.model.js`** — Updated address schema to `{ address_line1, address_line2, city, state, postal_code, country }` + added `businessName`, `contactNumber`
- **`user.dto.js`** — Updated validation for new address and business fields
- **`user.controller.js`** — `registerUser` now returns `access_token` + `user` for auto-login; `updateProfile` handles new fields
- **`auth.utils.ts`** — Updated `ApiUser` interface, added `authedPut`, `setupBusinessProfile`
- **`ShopSetup.tsx`** _(new)_ — 3-step animated wizard (Identity → Address → Social)
- **`routes.tsx`** — Added `/shop-setup` route

### Flow
```
Register → auto-login → /shop-setup → fill 3 steps → Finish → /dashboard
```

---

## Phase 1 — Multi-Shop Subscription System

### New Backend Models

| File | Collection | Purpose |
|------|-----------|---------|
| `subscription-plan.model.js` | `subscription_plans` | Plan tiers with limits |
| `user-subscription.model.js` | `user_subscriptions` | Purchases + admin approval |
| `shop.model.js` | `shops` | Multi-shop with receipt branding |
| `shop-member.model.js` | `shop_members` | Role assignments (owner/moderator) |
| `invoice.model.js` | `invoices` | Invoice line items + totals |

### New API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/shop` | POST | owner | Create shop (enforces plan limits) |
| `/api/shop` | GET | owner | List my shops + moderator shops |
| `/api/shop/:id` | GET/PUT/DEL | owner | Manage shop |
| `/api/shop/:id/members` | POST/GET | owner | Add/list moderators |
| `/api/subscription/plans` | GET | public | List available plans |
| `/api/subscription/purchase` | POST | owner | Submit payment |
| `/api/subscription/my` | GET | owner | View my subscription |
| `/api/subscription/admin/plans` | CRUD | admin | Manage plans |
| `/api/subscription/admin/subscriptions` | GET | admin | All subscriptions |
| `/api/subscription/admin/subscriptions/:id` | PUT | admin | Approve/reject |
| `/api/subscription/admin/stats` | GET | admin | Revenue stats |

### Seed Script
```bash
node seed_free_plan.js
```
- Creates the **Free** plan (1 shop, 10 products, 0 moderators, 20 invoices/mo)
- Auto-assigns Free plan to all existing users
- Migrates `role: "customer"` → `role: "owner"` for all non-admin users

### User Model Change
```diff
- enum: ["admin", "customer"]
+ enum: ["admin", "owner"]
```

### Subscription Plans

| Plan | Price | Shops | Moderators | Products | Invoices/mo |
|------|-------|-------|------------|----------|-------------|
| Free | ৳0 | 1 | 0 | 10 | 20 |
| Starter | ৳499/mo | 2 | 2 | 50 | 100 |
| Business | ৳999/mo | 5 | 5 | 200 | Unlimited |
| Enterprise | ৳2499/mo | Unlimited | 10 | Unlimited | Unlimited |

---

## Phase 5 — Owner Dashboard (Mobile-First)

### Changes
- **`Dashboard.tsx`** — Completely rewritten from scratch using the **Deep Sea (`ds-*`) design system**. Removed all old zinc/dark-theme UI.

### 4-Tab Bottom Navigation

| Tab | Icon | Content |
|-----|------|---------|
| **Buy Plan** | `workspace_premium` | All subscription plans with pricing; current plan highlighted; upgrade CTAs |
| **Products** | `inventory_2` | 5 preloaded demo products; free plan limit badge; inline stock/status |
| **Demo Invoice** | `receipt_long` | Full receipt preview with shop branding; print/share locked behind paid plan |
| **Profile** | `manage_accounts` | User info, email verification notice, shop details, settings, logout |

### Design System Used
All UI uses `var(--ds-*)` CSS tokens from `theme.css`:
- `--ds-primary-container` `#005C72` — primary teal
- `--ds-surface-container-lowest` — card backgrounds
- `--ds-outline-variant` — borders
- Fonts: `Manrope` (headings), `Inter` (body)
- Material Symbols Outlined icons

### Demo Products (Preloaded)
1. 🎧 Premium Wireless Headphones — ৳2,499
2. 👜 Leather Executive Wallet — ৳899
3. 🪑 Ergonomic Desk Chair — ৳9,500
4. 🧴 Stainless Steel Water Bottle — ৳650
5. ⌨️ Mechanical Gaming Keyboard — ৳3,800 _(out of stock)_

---

## Phase 4 — Admin Subscription Dashboard (Mobile-First)

### Changes
- **`AdminDashboard.tsx`** _(new)_ — Full admin subscription management page using the **Deep Sea (`ds-*`) design system**
- **`auth.utils.ts`** — Added `authedGet`, `authedPut`, `adminApi` object with `getStats`, `listSubscriptions`, `handleSubscription`
- **`routes.tsx`** — Added `/admin/dashboard` route
- **`app.js`** — Added `http://localhost:5173` to CORS origins

### 4-Tab Bottom Navigation

| Tab | Icon | Content |
|-----|------|---------|
| **Overview** | `dashboard` | Stats cards (pending, active, revenue); top-5 pending approvals |
| **Pending** | `pending_actions` | Filtered list of pending subscription requests with approve/reject |
| **All Subs** | `list_alt` | Full subscription list with status filter pills (all/pending/active/expired/cancelled) |
| **Profile** | `admin_panel_settings` | Admin info, role badge, sign-out |

### Admin API Endpoints Used
- `GET /api/subscription/admin/stats` → stat cards
- `GET /api/subscription/admin/subscriptions?status=` → subscription list
- `PUT /api/subscription/admin/subscriptions/:id` → approve/reject actions

### Features
- Mobile-first layout (max-width 480px centered)
- Approve/reject with toast feedback
- Auth guard (redirects non-admin to `/login`)
- Status-colored left borders + pill badges
- Filter pills for quick status filtering
- Material Symbols Outlined icons with `FILL` toggle for active nav state

---

## Phase 3 — Product Management & Multi-tenancy

### Changes
- **`ProductManagement.tsx`** — Created a separate mobile-first UI for product CRUD operations, maintaining the DS design system.
- **Shop Scoping (Multi-tenancy)** — Successfully implemented isolation for all products. Each product now requires a `shopId` and is private to the owner of that shop.
- **Ownership Verification** — Replaced placeholder `customer` role with the proper `owner` role. Backend controllers now verify that the logged-in owner actually owns the shop associated with any product modification.
- **Subscription Enforcement** — Product creation is now restricted by the owner's active plan limits (e.g., max 5 products for Free plan).
- **Backend API Integration** — `authedFormDataPost` and `authedFormDataPut` helpers to handle `multipart/form-data` uploads securely.
- **Image Optimization** — Real-time image compression using `sharp` within the `image-optimizer.middleware.js`, squashing uploaded image sizes to `1920x1920` WebP/JPEG/PNG format.
- **Variant Management** — Products use a robust `Varient` structure. Seeded base variant sizes (`S`, `M`, `L`, `XL`). Owners can view all variants.
- **Orphan Image Cleanup** — Scheduled a `node-cron` job (`cleanup_images.js`) to run every Sunday at midnight, flushing out deleted or unlinked images.

---

## Phase 6 — Advanced Admin Subscription Controls

### Changes
- **Plan Lifecycle Management** — Admins can now **Activate/Deactivate** subscription plans and billing cycles in real-time.
- **Audit Trails** — Added `deactivatedAt` timestamps to track deactivation history.
- **UI Improvements**:
    - Detailed status badges in the Admin Dashboard.
    - Added `maxModeratorsPerShop` field to the "Create New Plan" form.
    - Prevented browser auto-fill/autocomplete on administrative forms.
    - Ensured numeric fields handle empty states correctly.

---

## Phase 7 — Intelligent Demo Product System

### Changes
- **Seeded Demo Products** — Created 10 professional demo items (Mechanical Keyboards, SSDs, Ergonomic Chairs, etc.) to give new users an immediate starting point.
- **Logic** — If a user is on the **Free** plan, the dashboard automatically fetches and displays these 10 demo products alongside any they create themselves.
- **Isolation** — Demo products are system-wide (`isDemo: true`) and use `product_placeholder.png` as fallback.
- **Read-Only Demo** — Demo products are marked with a "DEMO" badge, and Edit/Delete actions are disabled for them.

---

## What Remains / Next Up
- **Phase 2 (Invoice Generation)** — Real invoice and receipt generation, tied to physical shop branding (`receiptConfig`).
- **Subscription Upgrade Flow** — Purchase endpoint exists but no payment integration or upgrade UX.
- **Subscription Renewal** — No renewal logic or UI for expired subscriptions.
- **Brand & Category Scoping** — Brands and Categories are still global. They should ideally move to `shopId` scoping soon.
- **Search & Filtering UI** — Dashboard needs pagination/filters for long product lists.
- **Moderator Assignment** — Implement the logic to invite and assign moderators to specific shops.
- **Recurring Customer Search** — Upcoming feature.
- **Notification System** — Upcoming feature.
