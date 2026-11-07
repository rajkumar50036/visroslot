-- RestoFlow Seed Data

-- 1. Insert Demo Restaurant
INSERT INTO restaurants (id, name, slug, description, cuisine_type, phone, address, opening_hours, rating, review_count, currency, currency_symbol, tax_rate, wifi_ssid, wifi_password)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Bistro Grande & Spice Kitchen',
  'bistro-grande',
  'Artisanal Italian Bistro meets rich slow-cooked Indian Spice Kitchen. Handcrafted recipes made fresh to order.',
  'Italian & Indo-Fusion',
  '+1 (555) 382-9900',
  '742 Evergreen Terrace, Downtown culinary district',
  '11:30 AM – 11:00 PM',
  4.8,
  1240,
  'USD',
  '$',
  8.25,
  'Bistro_Guest_FastWiFi',
  'Truffle2026'
) ON CONFLICT (slug) DO NOTHING;

-- 2. Insert Branch
INSERT INTO branches (id, restaurant_id, branch_name, branch_code, address, phone)
VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Downtown Central #104',
  'BRANCH-104',
  '742 Evergreen Terrace, Downtown culinary district',
  '+1 (555) 382-9900'
) ON CONFLICT (restaurant_id, branch_code) DO NOTHING;

-- 3. Insert Demo Staff Users
INSERT INTO users (id, email, full_name, is_superadmin)
VALUES 
  ('u0000000-0000-0000-0000-000000000001', 'alex.vance@bistrogrande.com', 'Alex Vance', false),
  ('u0000000-0000-0000-0000-000000000002', 'admin@restoflow.app', 'Platform SuperAdmin', true)
ON CONFLICT (email) DO NOTHING;

INSERT INTO memberships (user_id, restaurant_id, branch_id, role)
VALUES 
  ('u0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'OWNER')
ON CONFLICT (user_id, restaurant_id, branch_id) DO NOTHING;

-- 4. Insert Tables with Secure Unique Tokens
INSERT INTO restaurant_tables (id, restaurant_id, branch_id, table_number, capacity, secure_token)
VALUES
  ('t0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '01', 2, 'tbl_tok_01_7f8a9b'),
  ('t0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '02', 4, 'tbl_tok_02_4e1c2d'),
  ('t0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '03', 4, 'tbl_tok_03_9a2b5e'),
  ('t0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '04', 6, 'tbl_tok_04_3d8f1a'),
  ('t0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '05', 2, 'tbl_tok_05_6c7b0d'),
  ('t0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '06', 4, 'tbl_tok_06_1a8e9f'),
  ('t0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '07', 4, 'tbl_tok_07_5b2d8c'),
  ('t0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '08', 6, 'tbl_tok_08_8f4c1e'),
  ('t0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '09', 2, 'tbl_tok_09_2c9a7d'),
  ('t0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '12', 4, 'tbl_tok_12_0d4f3b')
ON CONFLICT (secure_token) DO NOTHING;

-- 5. Insert Menu Categories
INSERT INTO menu_categories (id, restaurant_id, name, slug, display_order)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Biryani Specials', 'biryani', 1),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Starters & Small Plates', 'starters', 2),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Main Course', 'main', 3),
  ('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Beverages & Mocktails', 'beverages', 4),
  ('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Desserts', 'desserts', 5)
ON CONFLICT DO NOTHING;

-- 6. Insert Menu Items
INSERT INTO menu_items (id, restaurant_id, category_id, name, description, price, is_veg, image_url, is_popular, is_available, preparation_time_minutes, kitchen_station)
VALUES
  (
    'm0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'Hyderabadi Dum Chicken Biryani',
    'Rich aromatic basmati rice slow-cooked with tender marinated chicken, caramelized onions, and saffron strands.',
    22.00,
    false,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDRapZmNDR53Ixe_aGaNd3yeqC5kal0OdA9u3VDI0pVHqyHRlPMWM_yY-Dr_YENPn90HnhBTlNwOL9di10QS0lyir3NE1OYzb_MELw6KxZsVH7I49oYsAlwjzkJe5K9dMvF3s_8wO7N1kqpWGXxmVLhfq2qx457oScB5l80aWhQsGppoINxxzDVs1DOV6dSNGZ8lTTGwW3pA9hY-bc6-q5rm8xC2u7WothrnZ1rBj2peN_qJObouI_l',
    true,
    true,
    18,
    'Hot Line'
  ),
  (
    'm0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000003',
    'Paneer Tikka Masala',
    'Char-grilled cottage cheese cubes simmered in spiced creamy tomato and cashew gravy.',
    19.00,
    true,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBWqOFRuRh0iT4nnCHZ4OPKyB8pL16Zd3YOi73DKYx7CJW2DdcStc4QEZsX0opQeVEtO31kvMP6SWsueEq2ZMWstpIrEVpF-W1FLKmHvtdrQ0K5NSsVJ7svnrJuP7A25-9V52W302InmmQjpH4-BfSmKClr23UcmtilYDnMW4spN-I9dgRdvlUyYZyMj5jsBZ2mHd1kv3RfSZto74xi2wwGk1NgIjAmqW6TA2uHP39iIXwP0JCOxOOI',
    true,
    true,
    14,
    'Hot Line'
  ),
  (
    'm0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000003',
    'Truffle Rigatoni',
    'House-made bronze-cut rigatoni, black winter truffle cream, 24-month aged Parmigiano Reggiano.',
    19.00,
    true,
    'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=600&auto=format&fit=crop&q=80',
    true,
    true,
    12,
    'Hot Line'
  ),
  (
    'm0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000002',
    'Artisanal Burrata',
    'Creamy Puglia burrata, heirloom cherry tomatoes, basil pesto drizzle, grilled sourdough toast.',
    16.00,
    true,
    'https://images.unsplash.com/photo-1592417817098-8f3d69104a47?w=600&auto=format&fit=crop&q=80',
    false,
    true,
    8,
    'Cold Kitchen'
  ),
  (
    'm0000000-0000-0000-0000-000000000005',
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000003',
    'Wagyu Smash Burger',
    'Double dry-aged wagyu beef patties, melted sharp cheddar, caramelized onions, smoked truffle aioli, brioche bun.',
    22.00,
    false,
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
    true,
    true,
    15,
    'Grill'
  ),
  (
    'm0000000-0000-0000-0000-000000000006',
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000002',
    'Crispy Polenta Fries',
    'Golden rosemary polenta sticks tossed in pecorino romano with roasted garlic aioli dip.',
    10.50,
    true,
    'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80',
    false,
    true,
    10,
    'Hot Line'
  ),
  (
    'm0000000-0000-0000-0000-000000000007',
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000003',
    'Wood-fired Margherita',
    'San Marzano tomato DOP, fior di latte mozzarella, fresh fragrant basil, extra virgin olive oil.',
    22.00,
    true,
    'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=600&auto=format&fit=crop&q=80',
    true,
    true,
    12,
    'Hot Line'
  ),
  (
    'm0000000-0000-0000-0000-000000000008',
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000002',
    'Smoked Hot Wings',
    'Applewood smoked chicken wings tossed in fiery ghost-chili glaze, served with blue cheese dressing.',
    18.00,
    false,
    'https://images.unsplash.com/photo-1527477378377-6a1649f8749a?w=600&auto=format&fit=crop&q=80',
    false,
    true,
    14,
    'Grill'
  ),
  (
    'm0000000-0000-0000-0000-000000000009',
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000003',
    'Wild Mushroom Risotto',
    'Acquerello carnaroli rice, chanterelle & porcini mushrooms, thyme butter, aged pecorino.',
    26.00,
    true,
    'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?w=600&auto=format&fit=crop&q=80',
    false,
    true,
    16,
    'Hot Line'
  ),
  (
    'm0000000-0000-0000-0000-000000000010',
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000003',
    'Chilean Sea Bass',
    'Pan-seared Chilean sea bass fillet, saffron velouté, charred asparagus, microgreens.',
    52.00,
    false,
    'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&auto=format&fit=crop&q=80',
    true,
    true,
    18,
    'Hot Line'
  ),
  (
    'm0000000-0000-0000-0000-000000000011',
    'a0000000-0000-0000-0000-000000000005',
    'Berry Panna Cotta',
    'Silky Madagascar vanilla bean panna cotta topped with wild berry compote and mint.',
    16.00,
    true,
    'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&auto=format&fit=crop&q=80',
    false,
    true,
    5,
    'Dessert'
  ),
  (
    'm0000000-0000-0000-0000-000000000012',
    'a0000000-0000-0000-0000-000000000004',
    'Signature Craft Cola / Soda',
    'Hand-crafted artisanal botanic cola with hints of cinnamon, citrus, and raw cane sugar.',
    4.00,
    true,
    'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80',
    false,
    true,
    2,
    'Beverage Bar'
  )
ON CONFLICT DO NOTHING;

-- 7. Insert Item Variants & Addons
INSERT INTO item_variants (menu_item_id, name, price_modifier)
VALUES
  ('m0000000-0000-0000-0000-000000000001', 'Regular (Serves 1-2)', 0.00),
  ('m0000000-0000-0000-0000-000000000001', 'Large Pot (Serves 3-4)', 14.00),
  ('m0000000-0000-0000-0000-000000000005', 'Single Patty', -4.00),
  ('m0000000-0000-0000-0000-000000000005', 'Double Patty (Original)', 0.00),
  ('m0000000-0000-0000-0000-000000000005', 'Triple Wagyu Stacker', 6.00)
ON CONFLICT DO NOTHING;

INSERT INTO item_addons (menu_item_id, name, price)
VALUES
  ('m0000000-0000-0000-0000-000000000001', 'Extra Mirchi Ka Salan & Raita', 3.00),
  ('m0000000-0000-0000-0000-000000000001', 'Boiled Organic Egg (2 pcs)', 2.50),
  ('m0000000-0000-0000-0000-000000000003', 'Fresh Shaved Black Truffle', 8.00),
  ('m0000000-0000-0000-0000-000000000003', 'Extra Aged Parmigiano', 3.50),
  ('m0000000-0000-0000-0000-000000000005', 'Applewood Smoked Bacon', 3.50),
  ('m0000000-0000-0000-0000-000000000005', 'Fried Organic Egg', 2.00)
ON CONFLICT DO NOTHING;
