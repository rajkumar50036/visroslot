# RestoFlow – Complete Multi-Restaurant QR Ordering SaaS

RestoFlow is an enterprise-grade, multi-tenant digital dining and restaurant operations SaaS platform. Diners scan secure table QR codes to access high-performance interactive menus, customize dishes, and send orders directly to kitchen display systems (KDS).

---

## ⭐️ Key Architectural Pillars

### 1. Strict "Payment At Counter Only" Zero-Online-Gateway Rule
- In restaurant hospitality, diners enjoy their meals and settle their bills physically at the cashier counter upon leaving.
- **RestoFlow explicitly enforces Zero Online Food Gateways**: no credit card entry or online payment gateways for food ordering.
- Once finished dining or upon placing the order, the diner pays at the restaurant counter using **Cash Tender, UPI at Counter, or POS Card Tap**.
- Cashiers verify the physical tender and record it in the Counter Cashier Terminal, instantly generating a printable official tax invoice and vacating the table session.
- SaaS platform subscription billing (Super Admin MRR) is completely segregated from restaurant food collections.

### 2. Multi-Tenant Isolation (Supabase PostgreSQL + RLS)
- Complete isolation between restaurants and branches.
- Cryptographic table tokens (`tbl_tok_[table]_[random]`) prevent exposing database UUIDs in public QR codes.
- Immutable order-item price snapshots guarantee audit compliance regardless of subsequent menu pricing changes.
- Row Level Security (RLS) policies protect all tenant data.

### 3. Real-Time Kitchen Display & Acoustic Audio Horn
- Sub-second cross-tab and WebSocket notifications powered by Supabase Realtime and BroadcastChannel sync.
- Acoustic multi-frequency Web Audio API synthesizers provide prominent kitchen chimes (85dB) that repeat until acknowledged.
- Prominent Real-time Incoming Order Alert banner with visual equalizer waveform animations and F2 keyboard shortcuts.

---

## 📱 Three Separate Application Interfaces

| Interface | URL Path | Description |
| :--- | :--- | :--- |
| **Customer QR Mobile Menu** | `/r/[restaurantSlug]/t/[secureTableToken]` | Mobile-first ordering site matching the Bistro Grande design reference. Automatic table detection, chef's spotlight, dish detail customizer, cart drawer, live 6-stage order tracking, and call waiter utilities. |
| **Restaurant Command Center** | `/dashboard` | Dark navy sidebar command centre matching design reference 1. 4-column live order pipeline, incoming audio alert banner, table inspector, KDS screen, counter cashier, inventory, and analytics. |
| **Super Admin Platform** | `/admin` | Platform owner controller for tenant lifecycle management, SaaS MRR metrics, and subscription plans (Starter, Growth, Premium). |

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 14 App Router, React 18, TypeScript, Tailwind CSS, Lucide Icons
- **Backend & Database**: Supabase PostgreSQL, Supabase Realtime, Server Route Handlers
- **Analytics & Audio**: Recharts, Web Audio API Acoustic Synthesizer
- **QR Generation**: QRCode SVG & PNG Engine, Canvas Confetti

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or 20+ LTS
- pnpm or npm

### Installation
```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev
```

Open `http://localhost:3000` to access the RestoFlow Portal.

---

## 🌐 Quick Access URLs (Localhost)

- **RestoFlow Hub & Portal**: [http://localhost:3000](http://localhost:3000)
- **Customer QR Menu (Table 08)**: [http://localhost:3000/r/bistro-grande/t/tbl_tok_08_8f4c1e](http://localhost:3000/r/bistro-grande/t/tbl_tok_08_8f4c1e)
- **Customer QR Menu (Table 04)**: [http://localhost:3000/r/bistro-grande/t/tbl_tok_04_3d8f1a](http://localhost:3000/r/bistro-grande/t/tbl_tok_04_3d8f1a)
- **Live Orders Command Center**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- **Kitchen Display System (KDS)**: [http://localhost:3000/dashboard/kds](http://localhost:3000/dashboard/kds)
- **Counter Cashier Terminal**: [http://localhost:3000/dashboard/cashier](http://localhost:3000/dashboard/cashier)
- **Tables & QR Management**: [http://localhost:3000/dashboard/tables](http://localhost:3000/dashboard/tables)
- **Menu & Items Hub**: [http://localhost:3000/dashboard/menu](http://localhost:3000/dashboard/menu)
- **Inventory & Ingredients**: [http://localhost:3000/dashboard/inventory](http://localhost:3000/dashboard/inventory)
- **Sales & Profit Analytics**: [http://localhost:3000/dashboard/analytics](http://localhost:3000/dashboard/analytics)
- **Staff & RBAC Roles**: [http://localhost:3000/dashboard/staff](http://localhost:3000/dashboard/staff)
- **Platform Settings**: [http://localhost:3000/dashboard/settings](http://localhost:3000/dashboard/settings)
- **Super Admin SaaS Dashboard**: [http://localhost:3000/admin](http://localhost:3000/admin)

---

## 🗄️ Database Schema & Supabase Setup

The complete PostgreSQL migration and seed data are located in:
- `supabase/migrations/20261028_initial_schema.sql`
- `supabase/seed.sql`

To apply to your live Supabase project:
1. Copy the contents of `supabase/migrations/20261028_initial_schema.sql` into the Supabase SQL Editor and execute.
2. Run `supabase/seed.sql` to populate sample restaurants, tables, dishes, and initial orders.
3. In your `.env.local`, set:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NEXT_PUBLIC_ENABLE_MOCK_FALLBACK=true
   ```

*Note: RestoFlow includes a transparent reactive store fallback, allowing full interactive testing even before connecting external Supabase credentials.*

---

## 🧪 Verification & End-to-End Testing Workflows

1. **TEST 1 – Create Restaurant Account**:
   - Access `/dashboard/settings` to review or update restaurant identity, tax rate, and Wi-Fi credentials.
2. **TEST 2 – Branches & Tables**:
   - Access `/dashboard/tables` to view Downtown Branch #104 tables (Tables 01-12) or add new tables.
3. **TEST 3 – QR Code Generation**:
   - Verify every table has a unique cryptographic token (`tbl_tok_XX_...`). Download PNG or print table tents.
4. **TEST 4 – Menu Management**:
   - Access `/dashboard/menu` to add categories, change food prices, toggle availability, or assign kitchen stations.
5. **TEST 5 – Customer QR Scan**:
   - Open `/r/bistro-grande/t/tbl_tok_08_8f4c1e` in a separate browser tab or mobile viewport. Notice automatic Table 08 detection and "Payment at Counter Only" banners.
6. **TEST 6 – Food Customization & Cart Checkout**:
   - Customize portion sizes and add-ons (e.g. Dum Biryani or Truffle Rigatoni), add kitchen allergy notes ("NO GARLIC"), and click **Confirm Order (Pay at Counter)**.
7. **TEST 7 – Live Real-Time Notification & Audio Chime**:
   - Switch to `/dashboard`. Notice the incoming order alert banner pulsating with animated audio waves and the loud acoustic chime playing.
8. **TEST 8 – Order Acknowledgment**:
   - Click **ACKNOWLEDGE & ACCEPT (F2)** to send the order to KDS.
9. **TEST 9 – Kitchen Display & Preparation**:
   - On `/dashboard/kds`, cooks check off items as they finish cooking and click **BUMP & MARK READY**.
10. **TEST 10 – Serving to Table**:
    - On `/dashboard`, the runner clicks **Mark Served to Table**. The customer's mobile tracker updates to *Served*.
11. **TEST 11 – Counter Cashier Collection**:
    - On `/dashboard/cashier`, select the table's unpaid bill, choose tender (Cash, UPI, or POS Card), and click **Confirm Receipt & Mark Paid**.
12. **TEST 12 – Analytics & Profit Update**:
    - View `/dashboard/analytics`. Verify that collected revenue, tender mix (Cash vs UPI vs Card), and operating profit update in real time.
13. **TEST 13 – Multi-Tenant Segregation**:
    - View `/admin` to verify Super Admin subscription management and tenant isolation policies.
