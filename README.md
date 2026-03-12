# ElectroGrid Frontend

Production-ready frontend for ElectroGrid — electricity grid and energy recharge platform. Built with React (Vite), TypeScript, TailwindCSS, and integrated with the Go REST API backend.

This app lives in the **`frontend/`** folder of the ElectrooGridd repo. Run it from the repo root with:

```bash
cd frontend
npm install
npm run dev
```

Then open **http://localhost:5173** in your browser.

## Tech Stack

- **Framework:** React 18 + Vite + TypeScript
- **State:** Zustand (auth), local component state
- **HTTP:** Axios with JWT Bearer interceptor
- **Styling:** TailwindCSS
- **Charts:** Recharts
- **Routing:** React Router v6

## Design System

- Mobile-first, card-based layout
- Colors: Primary `#3B82F6`, Success `#22C55E`, Warning `#F59E0B`, Danger `#EF4444`
- Spacing: 4px base scale (4, 8, 12, 16, 20, 24, 32, 40)
- Reusable components: Button, Card, Input, NumberKeypad, HeaderBar, Loader, SkeletonLoader, AlertBadge, ToastNotification, Modal

## Setup

```bash
npm install
npm run dev
```

- **Dev server:** http://localhost:5173
- **API:** Uses `https://electrogrid-backend-dev.up.railway.app` by default. Override with `VITE_API_URL` in `.env`.

## Build

```bash
npm run build
npm run preview   # preview production build
```

## Modules

1. **Auth** — Login, Register; JWT stored in `localStorage` and attached via Axios interceptor.
2. **Dashboard** — Greeting, balance card, energy usage chart (daily), estimated bill, alerts list.
3. **Meter & Recharge** — Step flow: Verify meter → Link meter → Enter amount → Confirm payment (Paystack) → Track status; plus Recharge History.

## API (Railway backend – Swagger)

- **Base:** `https://electrogrid-backend-dev.up.railway.app/api/v1`
- **Swagger:** https://electrogrid-backend-dev.up.railway.app/swagger/index.html
- **Verify meter:** `POST /meters/verify` → returns `customer_name`, `meter_number`, `disco_name`, `meter_type`, `meter_id`, etc. Flow shows “Is this your meter?” before linking.
- **Verify meter:** `POST /meters/verify` (auth) → `{ meter_number }` → `customer_name`, `disco_name`, `meter_id`, etc.
- **Link meter:** `POST /users/me/meters/link` → `{ meter_id }` only.
- **Create intent:** `POST /recharges/intents` → `{ meter_id, amount_kobo }` (1 Naira = 100 Kobo).
- **Confirm:** `POST /recharges/confirm` → `{ intent_id, payment_provider, payment_reference }`.
- **Usage:** `GET /users/me/usage`. Note: `/billing/balance` and `/notifications/alerts` are not in the current API. Frontend uses “Load more” pagination.

## Project Structure

```
src/
├── components/     # Reusable UI (Button, Card, Input, etc.)
├── features/      # auth, dashboard, meter, recharge
├── services/      # API client + auth, user, billing, energy, notifications, meters, recharges
├── store/         # authStore (Zustand)
├── layouts/       # AuthLayout, MainLayout
├── routes/        # Handled in App.tsx (protected vs public)
└── index.css      # Tailwind base
```

## Quality

- Loading states and skeleton loaders on dashboard
- Form validation and error messages on auth and recharge
- Protected routes with redirect to `/login` when unauthenticated
- Token stored in localStorage; 401 responses clear token and redirect to login
- Mobile-responsive layout
