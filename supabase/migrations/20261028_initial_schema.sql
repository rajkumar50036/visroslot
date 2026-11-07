-- RestoFlow Production Database Migration
-- PostgreSQL schema for Multi-Tenant Restaurant QR SaaS

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. SAAS PLANS & SUBSCRIPTIONS
-- ==========================================
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL UNIQUE,
  slug VARCHAR(50) NOT NULL UNIQUE,
  monthly_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  annual_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  max_tables INTEGER NOT NULL DEFAULT 10,
  max_branches INTEGER NOT NULL DEFAULT 1,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed initial SaaS plans
INSERT INTO plans (name, slug, monthly_price, annual_price, max_tables, max_branches, features)
VALUES 
  ('Starter', 'starter', 29.00, 290.00, 15, 1, '["15 Tables QR", "Live Orders Kanban", "Realtime Sound Horn", "Cashier Terminal", "Basic Analytics"]'::jsonb),
  ('Growth', 'growth', 79.00, 790.00, 50, 3, '["50 Tables QR", "3 Branches", "Live KDS Kitchen Display", "Inventory & Stock", "Recipe Costing & Profit Analytics", "Priority Support"]'::jsonb),
  ('Premium', 'premium', 199.00, 1990.00, 999, 10, '["Unlimited Tables", "10 Branches", "Full KDS Kitchen Display", "Advanced Profit & Loss", "Custom Branding", "Dedicated Account Manager"]'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- ==========================================
-- 2. RESTAURANTS & BRANCHES
-- ==========================================
CREATE TABLE IF NOT EXISTS restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  logo_url TEXT,
  cover_url TEXT,
  description TEXT,
  cuisine_type VARCHAR(100),
  phone VARCHAR(50),
  address TEXT,
  opening_hours VARCHAR(100) DEFAULT '11:00 AM – 11:00 PM',
  rating NUMERIC(2, 1) DEFAULT 4.8,
  review_count INTEGER DEFAULT 120,
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  currency_symbol VARCHAR(5) NOT NULL DEFAULT '$',
  tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 5.00,
  service_charge_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  wifi_ssid VARCHAR(100) DEFAULT 'Bistro-Guest-WiFi',
  wifi_password VARCHAR(100) DEFAULT 'TasteGood2026',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_suspended BOOLEAN NOT NULL DEFAULT false,
  plan_id UUID REFERENCES plans(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  branch_name VARCHAR(255) NOT NULL,
  branch_code VARCHAR(50) NOT NULL,
  address TEXT,
  phone VARCHAR(50),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(restaurant_id, branch_code)
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id),
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE', -- 'TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED'
  billing_cycle VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscription_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'SUCCEEDED',
  invoice_number VARCHAR(100),
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 3. USERS & MEMBERSHIPS (RBAC)
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE, -- references auth.users(id) in Supabase
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  is_superadmin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'OWNER', -- 'OWNER', 'MANAGER', 'CASHIER', 'KITCHEN_STAFF'
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, restaurant_id, branch_id)
);

-- ==========================================
-- 4. TABLES & QR SCANS
-- ==========================================
CREATE TABLE IF NOT EXISTS restaurant_tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  table_number VARCHAR(50) NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 4,
  secure_token VARCHAR(64) NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(restaurant_id, branch_id, table_number)
);

CREATE TABLE IF NOT EXISTS customer_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  table_id UUID NOT NULL REFERENCES restaurant_tables(id) ON DELETE CASCADE,
  session_token VARCHAR(64) NOT NULL UNIQUE,
  device_fingerprint TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS qr_scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  table_id UUID NOT NULL REFERENCES restaurant_tables(id) ON DELETE CASCADE,
  session_id UUID REFERENCES customer_sessions(id) ON DELETE SET NULL,
  ip_address VARCHAR(50),
  user_agent TEXT,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 5. MENU SYSTEM
-- ==========================================
CREATE TABLE IF NOT EXISTS menu_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price NUMERIC(12, 2) NOT NULL,
  is_veg BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  is_available BOOLEAN NOT NULL DEFAULT true,
  preparation_time_minutes INTEGER NOT NULL DEFAULT 15,
  kitchen_station VARCHAR(50) NOT NULL DEFAULT 'Hot Line', -- 'Hot Line', 'Grill', 'Cold Kitchen', 'Beverage Bar', 'Dessert'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS item_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL, -- e.g. "Regular", "Large", "Full"
  price_modifier NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS item_addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL, -- e.g. "Extra Truffle Oil", "Add Cheese"
  price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 6. ORDERS & ORDER ITEMS
-- ==========================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(50) NOT NULL,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  table_id UUID NOT NULL REFERENCES restaurant_tables(id) ON DELETE CASCADE,
  customer_name VARCHAR(100) NOT NULL DEFAULT 'Guest',
  customer_phone VARCHAR(50),
  order_status VARCHAR(30) NOT NULL DEFAULT 'PENDING', 
  -- PENDING, ACCEPTED, PREPARING, READY, SERVED, COMPLETED, CANCELLED
  payment_status VARCHAR(30) NOT NULL DEFAULT 'UNPAID',
  -- UNPAID, PAID, REFUNDED
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  special_instructions TEXT,
  kitchen_station VARCHAR(50) DEFAULT 'Hot Line',
  placed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  prep_started_at TIMESTAMPTZ,
  ready_at TIMESTAMPTZ,
  served_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  item_name VARCHAR(255) NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price NUMERIC(12, 2) NOT NULL,
  selected_variant VARCHAR(100),
  selected_addons JSONB DEFAULT '[]'::jsonb,
  kitchen_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status VARCHAR(30),
  to_status VARCHAR(30) NOT NULL,
  changed_by VARCHAR(100),
  notes TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 7. COUNTER CASHIER COLLECTIONS
-- ==========================================
CREATE TABLE IF NOT EXISTS cash_collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  amount NUMERIC(12, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL, -- 'CASH', 'UPI', 'CARD'
  receipt_number VARCHAR(100) NOT NULL UNIQUE,
  collected_by VARCHAR(100) NOT NULL,
  notes TEXT,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 8. INVENTORY, RECIPES & EXPENSES (PROFIT)
-- ==========================================
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  unit VARCHAR(50) NOT NULL, -- 'kg', 'ltr', 'pack', 'pcs'
  current_stock NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  minimum_stock NUMERIC(10, 2) NOT NULL DEFAULT 5.00,
  unit_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  change_quantity NUMERIC(10, 2) NOT NULL,
  movement_type VARCHAR(50) NOT NULL, -- 'PURCHASE', 'USAGE', 'WASTAGE', 'ADJUSTMENT'
  reason TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  quantity_used NUMERIC(10, 4) NOT NULL,
  UNIQUE(menu_item_id, inventory_item_id)
);

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  category VARCHAR(50) NOT NULL, -- 'RENT', 'SALARIES', 'ELECTRICITY', 'PACKAGING', 'INGREDIENTS', 'OTHER'
  amount NUMERIC(12, 2) NOT NULL,
  description TEXT,
  incurred_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 9. NOTIFICATIONS & AUDIT LOGS
-- ==========================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  table_id UUID REFERENCES restaurant_tables(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL, -- 'NEW_ORDER', 'CALL_WAITER', 'REQUEST_BILL', 'EMERGENCY'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  details JSONB,
  ip_address VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 10. INDEXES FOR HIGH-PERFORMANCE QUERIES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_restaurants_slug ON restaurants(slug);
CREATE INDEX IF NOT EXISTS idx_tables_token ON restaurant_tables(secure_token);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_status ON orders(restaurant_id, order_status);
CREATE INDEX IF NOT EXISTS idx_orders_placed_at ON orders(placed_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_cash_collections_restaurant ON cash_collections(restaurant_id, collected_at);
CREATE INDEX IF NOT EXISTS idx_qr_scans_table ON qr_scans(table_id, scanned_at);
CREATE INDEX IF NOT EXISTS idx_notifications_restaurant ON notifications(restaurant_id, is_read, created_at);

-- ==========================================
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Public can read menu items & categories for active restaurants
CREATE POLICY "Public can view active restaurants" ON restaurants
  FOR SELECT USING (is_active = true AND is_suspended = false);

CREATE POLICY "Public can view menu categories" ON menu_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view menu items" ON menu_items
  FOR SELECT USING (is_available = true);

CREATE POLICY "Public can view tables by secure token" ON restaurant_tables
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public can create orders" ON orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can view their table orders" ON orders
  FOR SELECT USING (true);

CREATE POLICY "Public can create order items" ON order_items
  FOR INSERT WITH CHECK (true);

-- Realtime publication enablement for live sound notifications
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
