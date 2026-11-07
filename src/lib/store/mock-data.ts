import { 
  Restaurant, 
  Branch, 
  RestaurantTable, 
  MenuCategory, 
  MenuItem, 
  Order, 
  CashCollection,
  InventoryItem,
  Expense,
  SaaSPlan,
  SaaSSubscription,
  StaffMember
} from "@/types/database";

export const initialRestaurant: Restaurant = {
  id: "rest-001",
  name: "Bistro Grande & Spice Kitchen",
  slug: "bistro-grande",
  logo_url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=120&auto=format&fit=crop&q=80",
  description: "Artisanal Italian Bistro meets rich slow-cooked Indian Spice Kitchen. Handcrafted recipes made fresh to order.",
  cuisine_type: "Italian & Indo-Fusion",
  phone: "+1 (555) 382-9900",
  address: "742 Evergreen Terrace, Downtown Culinary District",
  opening_hours: "11:30 AM – 11:00 PM",
  rating: 4.8,
  review_count: 1200,
  currency: "USD",
  currency_symbol: "$",
  tax_rate: 8.25,
  service_charge_rate: 0.00,
  wifi_ssid: "Bistro_Grande_Guest",
  wifi_password: "TruffleButter2026",
  is_active: true,
  is_suspended: false,
  plan_id: "plan-growth",
  created_at: "2026-01-15T10:00:00Z"
};

export const initialBranches: Branch[] = [
  {
    id: "branch-104",
    restaurant_id: "rest-001",
    branch_name: "Downtown Central #104",
    branch_code: "BRANCH-104",
    address: "742 Evergreen Terrace, Downtown Culinary District",
    phone: "+1 (555) 382-9900",
    is_active: true,
    created_at: "2026-01-15T10:00:00Z"
  },
  {
    id: "branch-105",
    restaurant_id: "rest-001",
    branch_name: "Westside Promenade #105",
    branch_code: "BRANCH-105",
    address: "88 Ocean Avenue, Westside Harbor",
    phone: "+1 (555) 382-9901",
    is_active: true,
    created_at: "2026-04-20T10:00:00Z"
  }
];

export const initialTables: RestaurantTable[] = [
  {
    id: "tbl-01",
    restaurant_id: "rest-001",
    branch_id: "branch-104",
    table_number: "01",
    capacity: 2,
    secure_token: "tbl_tok_01_7f8a9b",
    is_active: true,
    total_scans: 42,
    active_orders_count: 0,
    created_at: "2026-02-01T08:00:00Z"
  },
  {
    id: "tbl-02",
    restaurant_id: "rest-001",
    branch_id: "branch-104",
    table_number: "02",
    capacity: 4,
    secure_token: "tbl_tok_02_4e1c2d",
    is_active: true,
    total_scans: 68,
    active_orders_count: 1,
    created_at: "2026-02-01T08:00:00Z"
  },
  {
    id: "tbl-03",
    restaurant_id: "rest-001",
    branch_id: "branch-104",
    table_number: "03",
    capacity: 4,
    secure_token: "tbl_tok_03_9a2b5e",
    is_active: true,
    total_scans: 35,
    active_orders_count: 0,
    created_at: "2026-02-01T08:00:00Z"
  },
  {
    id: "tbl-04",
    restaurant_id: "rest-001",
    branch_id: "branch-104",
    table_number: "04",
    capacity: 6,
    secure_token: "tbl_tok_04_3d8f1a",
    is_active: true,
    total_scans: 89,
    active_orders_count: 1,
    created_at: "2026-02-01T08:00:00Z"
  },
  {
    id: "tbl-05",
    restaurant_id: "rest-001",
    branch_id: "branch-104",
    table_number: "05",
    capacity: 2,
    secure_token: "tbl_tok_05_6c7b0d",
    is_active: true,
    total_scans: 27,
    active_orders_count: 0,
    created_at: "2026-02-01T08:00:00Z"
  },
  {
    id: "tbl-06",
    restaurant_id: "rest-001",
    branch_id: "branch-104",
    table_number: "06",
    capacity: 4,
    secure_token: "tbl_tok_06_1a8e9f",
    is_active: true,
    total_scans: 54,
    active_orders_count: 1,
    created_at: "2026-02-01T08:00:00Z"
  },
  {
    id: "tbl-07",
    restaurant_id: "rest-001",
    branch_id: "branch-104",
    table_number: "07",
    capacity: 4,
    secure_token: "tbl_tok_07_5b2d8c",
    is_active: true,
    total_scans: 62,
    active_orders_count: 0,
    created_at: "2026-02-01T08:00:00Z"
  },
  {
    id: "tbl-08",
    restaurant_id: "rest-001",
    branch_id: "branch-104",
    table_number: "08",
    capacity: 6,
    secure_token: "tbl_tok_08_8f4c1e",
    is_active: true,
    total_scans: 95,
    active_orders_count: 1,
    created_at: "2026-02-01T08:00:00Z"
  },
  {
    id: "tbl-09",
    restaurant_id: "rest-001",
    branch_id: "branch-104",
    table_number: "09",
    capacity: 2,
    secure_token: "tbl_tok_09_2c9a7d",
    is_active: true,
    total_scans: 41,
    active_orders_count: 1,
    created_at: "2026-02-01T08:00:00Z"
  },
  {
    id: "tbl-12",
    restaurant_id: "rest-001",
    branch_id: "branch-104",
    table_number: "12",
    capacity: 4,
    secure_token: "tbl_tok_12_0d4f3b",
    is_active: true,
    total_scans: 74,
    active_orders_count: 1,
    created_at: "2026-02-01T08:00:00Z"
  }
];

export const initialCategories: MenuCategory[] = [
  { id: "cat-all", restaurant_id: "rest-001", name: "All Items", slug: "all", display_order: 0, is_active: true, created_at: "2026-01-01" },
  { id: "cat-biryani", restaurant_id: "rest-001", name: "Biryani", slug: "biryani", display_order: 1, is_active: true, created_at: "2026-01-01" },
  { id: "cat-starters", restaurant_id: "rest-001", name: "Starters", slug: "starters", display_order: 2, is_active: true, created_at: "2026-01-01" },
  { id: "cat-main", restaurant_id: "rest-001", name: "Main Course", slug: "main", display_order: 3, is_active: true, created_at: "2026-01-01" },
  { id: "cat-beverages", restaurant_id: "rest-001", name: "Beverages", slug: "beverages", display_order: 4, is_active: true, created_at: "2026-01-01" },
  { id: "cat-desserts", restaurant_id: "rest-001", name: "Desserts", slug: "desserts", display_order: 5, is_active: true, created_at: "2026-01-01" }
];

export const initialMenuItems: MenuItem[] = [
  {
    id: "dish-biryani-dum",
    restaurant_id: "rest-001",
    category_id: "cat-biryani",
    name: "Hyderabadi Dum Chicken Biryani",
    description: "Rich aromatic basmati rice slow-cooked with tender marinated chicken, caramelized onions & saffron strands.",
    price: 24.99,
    is_veg: false,
    image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDRapZmNDR53Ixe_aGaNd3yeqC5kal0OdA9u3VDI0pVHqyHRlPMWM_yY-Dr_YENPn90HnhBTlNwOL9di10QS0lyir3NE1OYzb_MELw6KxZsVH7I49oYsAlwjzkJe5K9dMvF3s_8wO7N1kqpWGXxmVLhfq2qx457oScB5l80aWhQsGppoINxxzDVs1DOV6dSNGZ8lTTGwW3pA9hY-bc6-q5rm8xC2u7WothrnZ1rBj2peN_qJObouI_l",
    is_popular: true,
    is_available: true,
    preparation_time_minutes: 18,
    kitchen_station: "Hot Line",
    variants: [
      { id: "var-1", menu_item_id: "dish-biryani-dum", name: "Single Portion", price_modifier: 0 },
      { id: "var-2", menu_item_id: "dish-biryani-dum", name: "Family Handi (Serves 3-4)", price_modifier: 18.00 }
    ],
    addons: [
      { id: "add-1", menu_item_id: "dish-biryani-dum", name: "Extra Mirchi Ka Salan", price: 3.50 },
      { id: "add-2", menu_item_id: "dish-biryani-dum", name: "Boiled Spiced Egg (2 pcs)", price: 2.50 }
    ],
    created_at: "2026-01-01"
  },
  {
    id: "dish-paneer-tikka",
    restaurant_id: "rest-001",
    category_id: "cat-main",
    name: "Paneer Tikka Masala",
    description: "Char-grilled cottage cheese cubes simmered in spiced creamy tomato and cashew nut gravy.",
    price: 21.00,
    is_veg: true,
    image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuBWqOFRuRh0iT4nnCHZ4OPKyB8pL16Zd3YOi73DKYx7CJW2DdcStc4QEZsX0opQeVEtO31kvMP6SWsueEq2ZMWstpIrEVpF-W1FLKmHvtdrQ0K5NSsVJ7svnrJuP7A25-9V52W302InmmQjpH4-BfSmKClr23UcmtilYDnMW4spN-I9dgRdvlUyYZyMj5jsBZ2mHd1kv3RfSZto74xi2wwGk1NgIjAmqW6TA2uHP39iIXwP0JCOxOOI",
    is_popular: true,
    is_available: true,
    preparation_time_minutes: 14,
    kitchen_station: "Hot Line",
    variants: [
      { id: "var-pt-1", menu_item_id: "dish-paneer-tikka", name: "Regular Spicy", price_modifier: 0 },
      { id: "var-pt-2", menu_item_id: "dish-paneer-tikka", name: "Mild Butter Style", price_modifier: 1.50 }
    ],
    addons: [
      { id: "add-pt-1", menu_item_id: "dish-paneer-tikka", name: "Butter Garlic Naan", price: 4.50 },
      { id: "add-pt-2", menu_item_id: "dish-paneer-tikka", name: "Extra Paneer Cubes", price: 5.00 }
    ],
    created_at: "2026-01-01"
  },
  {
    id: "dish-truffle-rigatoni",
    restaurant_id: "rest-001",
    category_id: "cat-main",
    name: "Truffle Rigatoni",
    description: "House-made bronze-cut rigatoni, black winter truffle cream sauce, 24-month aged Parmigiano Reggiano.",
    price: 19.00,
    is_veg: true,
    image_url: "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=600&auto=format&fit=crop&q=80",
    is_popular: true,
    is_available: true,
    preparation_time_minutes: 12,
    kitchen_station: "Hot Line",
    variants: [
      { id: "var-tr-1", menu_item_id: "dish-truffle-rigatoni", name: "Classic Rigatoni", price_modifier: 0 },
      { id: "var-tr-2", menu_item_id: "dish-truffle-rigatoni", name: "Gluten-Free Penne", price_modifier: 2.50 }
    ],
    addons: [
      { id: "add-tr-1", menu_item_id: "dish-truffle-rigatoni", name: "Shaved Winter Truffle", price: 8.00 }
    ],
    created_at: "2026-01-01"
  },
  {
    id: "dish-burrata",
    restaurant_id: "rest-001",
    category_id: "cat-starters",
    name: "Artisanal Burrata",
    description: "Creamy Puglia burrata, heirloom cherry tomatoes, basil pesto drizzle, toasted sourdough bread.",
    price: 16.00,
    is_veg: true,
    image_url: "https://images.unsplash.com/photo-1592417817098-8f3d69104a47?w=600&auto=format&fit=crop&q=80",
    is_popular: false,
    is_available: true,
    preparation_time_minutes: 8,
    kitchen_station: "Cold Kitchen",
    created_at: "2026-01-01"
  },
  {
    id: "dish-wagyu-burger",
    restaurant_id: "rest-001",
    category_id: "cat-main",
    name: "Wagyu Smash Burger",
    description: "Double dry-aged wagyu beef patties, melted sharp cheddar, caramelized onions, smoked truffle aioli, brioche bun.",
    price: 22.00,
    is_veg: false,
    image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80",
    is_popular: true,
    is_available: true,
    preparation_time_minutes: 15,
    kitchen_station: "Grill",
    variants: [
      { id: "var-wb-1", menu_item_id: "dish-wagyu-burger", name: "Double Patty (Standard)", price_modifier: 0 },
      { id: "var-wb-2", menu_item_id: "dish-wagyu-burger", name: "Triple Stacked", price_modifier: 6.00 }
    ],
    addons: [
      { id: "add-wb-1", menu_item_id: "dish-wagyu-burger", name: "Applewood Bacon", price: 3.50 },
      { id: "add-wb-2", menu_item_id: "dish-wagyu-burger", name: "Fried Sunny Egg", price: 2.00 }
    ],
    created_at: "2026-01-01"
  },
  {
    id: "dish-polenta-fries",
    restaurant_id: "rest-001",
    category_id: "cat-starters",
    name: "Crispy Polenta Fries",
    description: "Golden rosemary polenta sticks tossed in pecorino romano with roasted garlic aioli dip.",
    price: 10.50,
    is_veg: true,
    image_url: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80",
    is_popular: false,
    is_available: true,
    preparation_time_minutes: 10,
    kitchen_station: "Hot Line",
    created_at: "2026-01-01"
  },
  {
    id: "dish-margherita",
    restaurant_id: "rest-001",
    category_id: "cat-main",
    name: "Wood-fired Margherita",
    description: "San Marzano tomato DOP, fior di latte mozzarella, fresh fragrant basil, extra virgin olive oil.",
    price: 22.00,
    is_veg: true,
    image_url: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=600&auto=format&fit=crop&q=80",
    is_popular: true,
    is_available: true,
    preparation_time_minutes: 12,
    kitchen_station: "Hot Line",
    created_at: "2026-01-01"
  },
  {
    id: "dish-hot-wings",
    restaurant_id: "rest-001",
    category_id: "cat-starters",
    name: "Smoked Hot Wings",
    description: "Applewood smoked chicken wings tossed in fiery ghost-chili glaze, served with blue cheese dip.",
    price: 18.00,
    is_veg: false,
    image_url: "https://images.unsplash.com/photo-1527477378377-6a1649f8749a?w=600&auto=format&fit=crop&q=80",
    is_popular: false,
    is_available: true,
    preparation_time_minutes: 14,
    kitchen_station: "Grill",
    created_at: "2026-01-01"
  },
  {
    id: "dish-risotto",
    restaurant_id: "rest-001",
    category_id: "cat-main",
    name: "Wild Mushroom Risotto",
    description: "Acquerello carnaroli rice, chanterelle & porcini mushrooms, thyme butter, aged pecorino.",
    price: 26.00,
    is_veg: true,
    image_url: "https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?w=600&auto=format&fit=crop&q=80",
    is_popular: false,
    is_available: true,
    preparation_time_minutes: 16,
    kitchen_station: "Hot Line",
    created_at: "2026-01-01"
  },
  {
    id: "dish-sea-bass",
    restaurant_id: "rest-001",
    category_id: "cat-main",
    name: "Chilean Sea Bass",
    description: "Pan-seared Chilean sea bass fillet, saffron velouté, charred asparagus, microgreens.",
    price: 52.00,
    is_veg: false,
    image_url: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&auto=format&fit=crop&q=80",
    is_popular: true,
    is_available: true,
    preparation_time_minutes: 18,
    kitchen_station: "Hot Line",
    created_at: "2026-01-01"
  },
  {
    id: "dish-panna-cotta",
    restaurant_id: "rest-001",
    category_id: "cat-desserts",
    name: "Berry Panna Cotta",
    description: "Silky Madagascar vanilla bean panna cotta topped with wild berry compote and mint.",
    price: 16.00,
    is_veg: true,
    image_url: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&auto=format&fit=crop&q=80",
    is_popular: false,
    is_available: true,
    preparation_time_minutes: 5,
    kitchen_station: "Dessert",
    created_at: "2026-01-01"
  },
  {
    id: "dish-craft-cola",
    restaurant_id: "rest-001",
    category_id: "cat-beverages",
    name: "Artisanal Craft Cola",
    description: "Botanic micro-brewed soda with natural spices, citrus peels, and raw sugar.",
    price: 4.00,
    is_veg: true,
    image_url: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80",
    is_popular: false,
    is_available: true,
    preparation_time_minutes: 2,
    kitchen_station: "Beverage Bar",
    created_at: "2026-01-01"
  }
];

export const initialOrders: Order[] = [
  {
    id: "ord-1092",
    order_number: "ORD-1092",
    restaurant_id: "rest-001",
    branch_id: "branch-104",
    table_id: "tbl-04",
    table_number: "04",
    customer_name: "Liam Ross",
    customer_phone: "+1 (555) 019-2831",
    order_status: "PENDING",
    payment_status: "UNPAID",
    subtotal: 54.00,
    tax_amount: 4.45,
    total_amount: 58.45,
    special_instructions: "Kitchen Note: NO GARLIC (Severe Allergy)",
    kitchen_station: "Hot Line",
    placed_at: new Date(Date.now() - 60000).toISOString(),
    items: [
      {
        id: "item-1092-1",
        order_id: "ord-1092",
        menu_item_id: "dish-truffle-rigatoni",
        item_name: "Truffle Rigatoni",
        unit_price: 19.00,
        quantity: 2,
        total_price: 38.00,
        kitchen_notes: "NO GARLIC (Severe Allergy)"
      },
      {
        id: "item-1092-2",
        order_id: "ord-1092",
        menu_item_id: "dish-burrata",
        item_name: "Artisanal Burrata",
        unit_price: 16.00,
        quantity: 1,
        total_price: 16.00
      },
      {
        id: "item-1092-3",
        order_id: "ord-1092",
        item_name: "Sparkling Water",
        unit_price: 0.00,
        quantity: 2,
        total_price: 0.00,
        kitchen_notes: "Complimentary Table Chilled"
      }
    ]
  },
  {
    id: "ord-1095",
    order_number: "ORD-1095",
    restaurant_id: "rest-001",
    branch_id: "branch-104",
    table_id: "tbl-12",
    table_number: "12",
    customer_name: "Priya Patel",
    order_status: "PENDING",
    payment_status: "UNPAID",
    subtotal: 32.50,
    tax_amount: 2.68,
    total_amount: 35.18,
    kitchen_station: "Grill",
    placed_at: new Date(Date.now() - 180000).toISOString(),
    items: [
      {
        id: "item-1095-1",
        order_id: "ord-1095",
        menu_item_id: "dish-wagyu-burger",
        item_name: "Wagyu Smash Burger",
        unit_price: 22.00,
        quantity: 1,
        total_price: 22.00
      },
      {
        id: "item-1095-2",
        order_id: "ord-1095",
        menu_item_id: "dish-polenta-fries",
        item_name: "Crispy Polenta Fries",
        unit_price: 10.50,
        quantity: 1,
        total_price: 10.50
      }
    ]
  },
  {
    id: "ord-1088",
    order_number: "ORD-1088",
    restaurant_id: "rest-001",
    branch_id: "branch-104",
    table_id: "tbl-02",
    table_number: "02",
    customer_name: "Marcus E.",
    order_status: "PREPARING",
    payment_status: "UNPAID",
    subtotal: 48.00,
    tax_amount: 3.96,
    total_amount: 51.96,
    kitchen_station: "Hot Line 1 & Grill",
    placed_at: new Date(Date.now() - 700000).toISOString(),
    prep_started_at: new Date(Date.now() - 650000).toISOString(),
    preparation_elapsed_seconds: 700,
    items: [
      {
        id: "item-1088-1",
        order_id: "ord-1088",
        menu_item_id: "dish-margherita",
        item_name: "Wood-fired Margherita",
        unit_price: 22.00,
        quantity: 1,
        total_price: 22.00
      },
      {
        id: "item-1088-2",
        order_id: "ord-1088",
        menu_item_id: "dish-hot-wings",
        item_name: "Smoked Hot Wings",
        unit_price: 18.00,
        quantity: 1,
        total_price: 18.00
      },
      {
        id: "item-1088-3",
        order_id: "ord-1088",
        menu_item_id: "dish-craft-cola",
        item_name: "Craft Cola",
        unit_price: 4.00,
        quantity: 2,
        total_price: 8.00
      }
    ]
  },
  {
    id: "ord-1085",
    order_number: "ORD-1085",
    restaurant_id: "rest-001",
    branch_id: "branch-104",
    table_id: "tbl-09",
    table_number: "09",
    customer_name: "Sarah J.",
    order_status: "PREPARING",
    payment_status: "UNPAID",
    subtotal: 26.00,
    tax_amount: 2.15,
    total_amount: 28.15,
    kitchen_station: "Hot Line",
    placed_at: new Date(Date.now() - 970000).toISOString(),
    prep_started_at: new Date(Date.now() - 900000).toISOString(),
    preparation_elapsed_seconds: 970,
    overdue: true,
    items: [
      {
        id: "item-1085-1",
        order_id: "ord-1085",
        menu_item_id: "dish-risotto",
        item_name: "Wild Mushroom Risotto",
        unit_price: 26.00,
        quantity: 1,
        total_price: 26.00
      }
    ]
  },
  {
    id: "ord-1081",
    order_number: "ORD-1081",
    restaurant_id: "rest-001",
    branch_id: "branch-104",
    table_id: "tbl-06",
    table_number: "06",
    customer_name: "Table 06 Guests",
    server_name: "David (Runner)",
    order_status: "READY",
    payment_status: "UNPAID",
    subtotal: 68.00,
    tax_amount: 5.61,
    total_amount: 73.61,
    kitchen_station: "Plated at Pass #2",
    placed_at: new Date(Date.now() - 1200000).toISOString(),
    ready_at: new Date(Date.now() - 120000).toISOString(),
    items: [
      {
        id: "item-1081-1",
        order_id: "ord-1081",
        menu_item_id: "dish-sea-bass",
        item_name: "Chilean Sea Bass",
        unit_price: 52.00,
        quantity: 1,
        total_price: 52.00
      },
      {
        id: "item-1081-2",
        order_id: "ord-1081",
        menu_item_id: "dish-panna-cotta",
        item_name: "Berry Panna Cotta",
        unit_price: 16.00,
        quantity: 1,
        total_price: 16.00
      }
    ]
  },
  {
    id: "ord-1077",
    order_number: "ORD-1077",
    restaurant_id: "rest-001",
    branch_id: "branch-104",
    table_id: "tbl-08",
    table_number: "08",
    customer_name: "Elena Rostova",
    order_status: "SERVED",
    payment_status: "UNPAID",
    subtotal: 85.50,
    tax_amount: 7.00,
    total_amount: 92.50,
    placed_at: new Date(Date.now() - 2400000).toISOString(),
    served_at: new Date(Date.now() - 600000).toISOString(),
    items: [
      {
        id: "item-1077-1",
        order_id: "ord-1077",
        menu_item_id: "dish-biryani-dum",
        item_name: "Hyderabadi Dum Chicken Biryani",
        unit_price: 24.99,
        quantity: 2,
        total_price: 49.98
      },
      {
        id: "item-1077-2",
        order_id: "ord-1077",
        menu_item_id: "dish-paneer-tikka",
        item_name: "Paneer Tikka Masala",
        unit_price: 21.00,
        quantity: 1,
        total_price: 21.00
      },
      {
        id: "item-1077-3",
        order_id: "ord-1077",
        menu_item_id: "dish-hot-wings",
        item_name: "Smoked Hot Wings",
        unit_price: 18.00,
        quantity: 1,
        total_price: 18.00
      }
    ]
  }
];

export const initialCashCollections: CashCollection[] = [
  {
    id: "col-101",
    order_id: "ord-1050",
    order_number: "ORD-1050",
    table_number: "03",
    restaurant_id: "rest-001",
    branch_id: "branch-104",
    amount: 142.50,
    payment_method: "CASH",
    receipt_number: "RCP-2026-0041",
    collected_by: "Alex Vance (Shift Lead)",
    notes: "Exact cash tendered $150, change $7.50 returned",
    collected_at: new Date(Date.now() - 14400000).toISOString()
  },
  {
    id: "col-102",
    order_id: "ord-1055",
    order_number: "ORD-1055",
    table_number: "05",
    restaurant_id: "rest-001",
    branch_id: "branch-104",
    amount: 210.00,
    payment_method: "UPI",
    receipt_number: "RCP-2026-0042",
    collected_by: "Alex Vance (Shift Lead)",
    notes: "Counter dynamic UPI QR scan verified",
    collected_at: new Date(Date.now() - 10800000).toISOString()
  },
  {
    id: "col-103",
    order_id: "ord-1062",
    order_number: "ORD-1062",
    table_number: "01",
    restaurant_id: "rest-001",
    branch_id: "branch-104",
    amount: 489.50,
    payment_method: "CARD",
    receipt_number: "RCP-2026-0043",
    collected_by: "Alex Vance (Shift Lead)",
    notes: "Counter terminal POS tap authorization #77281",
    collected_at: new Date(Date.now() - 7200000).toISOString()
  }
];

export const initialInventory: InventoryItem[] = [
  { id: "inv-1", restaurant_id: "rest-001", name: "Bronze-cut Rigatoni Pasta", unit: "kg", current_stock: 24.5, minimum_stock: 10, unit_cost: 3.20, updated_at: "2026-10-25" },
  { id: "inv-2", restaurant_id: "rest-001", name: "Black Winter Truffle Puree", unit: "ltr", current_stock: 4.2, minimum_stock: 2.0, unit_cost: 65.00, updated_at: "2026-10-25" },
  { id: "inv-3", restaurant_id: "rest-001", name: "Fresh Puglia Burrata", unit: "pcs", current_stock: 18, minimum_stock: 15, unit_cost: 4.50, updated_at: "2026-10-25" },
  { id: "inv-4", restaurant_id: "rest-001", name: "Organic Basmati Saffron Rice", unit: "kg", current_stock: 48.0, minimum_stock: 20, unit_cost: 2.80, updated_at: "2026-10-25" },
  { id: "inv-5", restaurant_id: "rest-001", name: "Aged Wagyu Beef Blend", unit: "kg", current_stock: 15.0, minimum_stock: 8, unit_cost: 18.50, updated_at: "2026-10-25" },
  { id: "inv-6", restaurant_id: "rest-001", name: "San Marzano Tomatoes DOP", unit: "pack", current_stock: 35, minimum_stock: 12, unit_cost: 2.10, updated_at: "2026-10-25" }
];

export const initialExpenses: Expense[] = [
  { id: "exp-1", restaurant_id: "rest-001", branch_id: "branch-104", category: "RENT", amount: 2800.00, description: "Monthly facility floor lease", incurred_at: "2026-10-01" },
  { id: "exp-2", restaurant_id: "rest-001", branch_id: "branch-104", category: "SALARIES", amount: 4500.00, description: "Floor staff, line cooks & prep chefs payroll", incurred_at: "2026-10-05" },
  { id: "exp-3", restaurant_id: "rest-001", branch_id: "branch-104", category: "ELECTRICITY", amount: 580.00, description: "Commercial kitchen power & refrigeration", incurred_at: "2026-10-10" },
  { id: "exp-4", restaurant_id: "rest-001", branch_id: "branch-104", category: "PACKAGING", amount: 320.00, description: "Compostable takeaway containers and cutlery", incurred_at: "2026-10-12" }
];

export const initialSaaSPlans: SaaSPlan[] = [
  {
    id: "plan-starter",
    name: "Starter",
    slug: "starter",
    monthly_price: 29.00,
    annual_price: 290.00,
    max_tables: 15,
    max_branches: 1,
    features: ["15 Table QR Codes", "Live Orders Kanban", "Realtime Sound Alerts", "Cashier Terminal", "Basic Analytics"],
    is_active: true
  },
  {
    id: "plan-growth",
    name: "Growth",
    slug: "growth",
    monthly_price: 79.00,
    annual_price: 790.00,
    max_tables: 50,
    max_branches: 3,
    features: ["50 Table QR Codes", "3 Branches", "Live KDS Kitchen Display", "Inventory & Stock", "Recipe Costing & Profit Analytics", "Priority Support"],
    is_active: true
  },
  {
    id: "plan-premium",
    name: "Premium",
    slug: "premium",
    monthly_price: 199.00,
    annual_price: 1990.00,
    max_tables: 999,
    max_branches: 10,
    features: ["Unlimited Tables", "10 Branches", "Full KDS Kitchen Display", "Advanced Profit & Loss", "Custom Branding", "Dedicated Account Manager"],
    is_active: true
  }
];

export const initialSaaSSubscriptions: SaaSSubscription[] = [
  {
    id: "sub-1",
    restaurant_id: "rest-001",
    restaurant_name: "Bistro Grande & Spice Kitchen",
    plan_id: "plan-growth",
    plan_name: "Growth",
    status: "ACTIVE",
    monthly_amount: 79.00,
    current_period_end: "2026-11-15T00:00:00Z"
  },
  {
    id: "sub-2",
    restaurant_id: "rest-002",
    restaurant_name: "Tokyo Ramen Bar",
    plan_id: "plan-starter",
    plan_name: "Starter",
    status: "ACTIVE",
    monthly_amount: 29.00,
    current_period_end: "2026-11-01T00:00:00Z"
  },
  {
    id: "sub-3",
    restaurant_id: "rest-003",
    restaurant_name: "La Trattoria Milano",
    plan_id: "plan-premium",
    plan_name: "Premium",
    status: "ACTIVE",
    monthly_amount: 199.00,
    current_period_end: "2026-11-20T00:00:00Z"
  },
  {
    id: "sub-4",
    restaurant_id: "rest-004",
    restaurant_name: "Coastal Breeze Seafood",
    plan_id: "plan-starter",
    plan_name: "Starter",
    status: "TRIAL",
    monthly_amount: 0.00,
    current_period_end: "2026-11-05T00:00:00Z"
  }
];

export const initialStaffMembers: StaffMember[] = [
  { id: "staff-1", restaurant_id: "rest-001", full_name: "Alex Vance", email: "alex.vance@bistrogrande.com", role: "OWNER", is_active: true, avatar_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuBOXZlcKScUkWNhMjvCM2NtGgQV55i39kCX2wJ6QKkC136sbHka0sZSScFYWLzctTl4NSu3Z2NZffBF3YxeA5wH8vTKsepMmZaBKfoAeuq0tUXeb4wqrVuoCUaVe34ehnuPwaE_nMYcygy2QG3GmFlECDVbFhgw-2_6hgV5WlfXq3T6rXgMhNNt0kmLgPigJCgi0DorU-xNQyshGGxdicbyS_odeeiJaPtdv9QQIg5pOxV-BqcChxJn" },
  { id: "staff-2", restaurant_id: "rest-001", full_name: "Marco Rossi", email: "marco.rossi@bistrogrande.com", role: "KITCHEN_STAFF", is_active: true },
  { id: "staff-3", restaurant_id: "rest-001", full_name: "David Silva", email: "david.runner@bistrogrande.com", role: "MANAGER", is_active: true },
  { id: "staff-4", restaurant_id: "rest-001", full_name: "Elena Rostova", email: "elena.cashier@bistrogrande.com", role: "CASHIER", is_active: true }
];
