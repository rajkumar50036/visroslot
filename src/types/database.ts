// Slotora Multi-Tenant SaaS Type Definitions

export type UserRole = 'OWNER' | 'STAFF' | 'ADMIN';

export type AppointmentStatus = 
  | 'PENDING'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type SubscriptionStatus = 
  | 'TRIALING'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'CANCELLED';

export interface Profile {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price_monthly: number;
  currency: string;
  max_bookings_per_month: number;
  max_staff_members: number;
  features: string[];
  is_active: boolean;
  created_at: string;
}

export interface Business {
  id: string;
  owner_id: string;
  owner_email?: string;
  name: string;
  slug: string;
  category: string;
  email: string;
  phone: string;
  address?: string | null;
  landmark?: string | null;
  city: string;
  state?: string | null;
  postal_code?: string | null;
  country: string;
  latitude?: number | null;
  longitude?: number | null;
  website?: string | null;
  timezone: string;
  currency: string;
  currency_symbol: string;
  description?: string | null;
  logo_url?: string | null;
  slot_interval_minutes: number;
  buffer_minutes: number;
  min_advance_hours: number;
  max_advance_days: number;
  plan?: string;
  subscription_status?: string;
  subscription_expires_at?: string;
  booking_quota_reached?: boolean;
  lifetime_free?: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  business_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  business_id: string;
  name: string;
  description?: string | null;
  duration_minutes: number;
  price: number;
  currency: string;
  image_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Staff {
  id: string;
  business_id: string;
  user_id?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  role_title: string;
  avatar_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StaffService {
  id: string;
  staff_id: string;
  service_id: string;
  created_at: string;
}

export interface BusinessHour {
  id: string;
  business_id: string;
  day_of_week: number; // 0 = Sunday, 1 = Monday...
  is_open: boolean;
  open_time: string; // "09:00:00"
  close_time: string; // "19:00:00"
  created_at: string;
  updated_at: string;
}

export interface BusinessBreak {
  id: string;
  business_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  label: string;
  created_at: string;
}

export interface BusinessHoliday {
  id: string;
  business_id: string;
  holiday_date: string; // YYYY-MM-DD
  reason: string;
  created_at: string;
}

export interface Customer {
  id: string;
  business_id: string;
  full_name: string;
  email: string;
  phone: string;
  notes?: string | null;
  total_bookings: number;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  business_id: string;
  service_id: string;
  staff_id?: string | null;
  customer_id: string;
  booking_reference: string;
  appointment_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM:SS
  end_time: string; // HH:MM:SS
  status: AppointmentStatus;
  service_price: number;
  customer_notes?: string | null;
  notes?: string | null;
  cancellation_reason?: string | null;
  created_at: string;
  updated_at: string;
  // Firestore flat document snapshots
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  service_name?: string | null;
  staff_name?: string | null;
  management_token?: string | null;
  // Joined fields for display
  service?: Service;
  staff?: Staff | null;
  customer?: Customer;
  is_reviewed?: boolean;
  reviewed_at?: string;
  review_id?: string;
  review_invitation_sent_at?: string;
}

export type ReviewStatus = 'PUBLISHED' | 'PENDING' | 'HIDDEN' | 'REPORTED';

export interface OwnerResponse {
  response_text: string;
  responded_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  business_id: string;
  appointment_id: string;
  customer_id?: string | null;
  customer_name: string;
  customer_email?: string | null;
  customer_phone?: string | null;
  service_id?: string | null;
  service_name?: string | null;
  staff_id?: string | null;
  staff_name?: string | null;
  appointment_date?: string;
  rating: number; // 1 to 5 integer
  feedback?: string | null;
  status: ReviewStatus;
  verified_booking: boolean;
  owner_response?: OwnerResponse | null;
  report_reason?: string | null;
  reported_at?: string | null;
  reported_by?: string | null;
  moderated_at?: string | null;
  moderated_by?: string | null;
  moderation_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewInvitation {
  id: string; // rev_invite_${appointmentId}
  appointment_id: string;
  business_id: string;
  customer_name: string;
  customer_email?: string | null;
  customer_phone?: string | null;
  service_name: string;
  management_token?: string | null;
  review_url: string;
  status: 'SENT' | 'PENDING_CONFIG' | 'FAILED';
  created_at: string;
}

// Phase 7: Owner AI – Business Memory & Automation Types
export interface ConfirmedInstruction {
  id: string;
  instruction: string;
  source: 'onboarding' | 'chat_confirmed' | 'settings';
  created_at: string;
  updated_at: string;
}

export interface BusinessAIMemory {
  id: string; // mem_${business_id}
  business_id: string;
  business_name?: string;
  business_category?: string;
  monthly_revenue_target?: number;
  customer_growth_target?: number;
  challenges?: string[];
  priorities?: string[];
  marketing_style?: 'conservative' | 'growth' | 'premium' | 'promotional';
  promotion_preferences?: string;
  communication_tone?: 'professional' | 'warm' | 'concise' | 'playful';
  target_customers?: string;
  operating_notes?: string;
  confirmed_instructions: ConfirmedInstruction[];
  created_at: string;
  updated_at: string;
}

export type AIActionType =
  | 'CUSTOMER_FOLLOWUP_DRAFT'
  | 'REBOOKING_CAMPAIGN_DRAFT'
  | 'PROMOTION_DRAFT'
  | 'STAFF_SCHEDULE_SUGGESTION'
  | 'DAILY_SUMMARY_PREPARE';

export type AIActionStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXECUTED'
  | 'FAILED'
  | 'EXPIRED';

export interface AIProposedAction {
  id: string; // act_${id}
  business_id: string;
  type: AIActionType;
  title: string;
  reason: string;
  supporting_data: Record<string, any>;
  expected_outcome: string; // Labeled estimate
  action_payload: Record<string, any>;
  status: AIActionStatus;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  executed_at?: string | null;
  execution_result?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AIActionLog {
  id: string;
  action_id: string;
  business_id: string;
  action_type: AIActionType;
  status: AIActionStatus;
  user_id: string;
  details: string;
  created_at: string;
}

export interface DailyBusinessReport {
  id: string; // daily_${business_id}_${date}
  business_id: string;
  report_date: string; // YYYY-MM-DD
  summary_text: string;
  appointments_summary: {
    today: number;
    upcoming: number;
    completed: number;
    cancelled: number;
    no_shows: number;
  };
  revenue_collected: number; // Strictly from verified payments
  booked_service_value: number; // Potential pipeline
  customer_followups: Array<{ name: string; reason: string; phone?: string; customer_id?: string }>;
  staff_observations: Array<{ name: string; note: string }>;
  operational_warnings: string[];
  recommended_priorities: string[]; // Exactly 3 priorities
  created_at: string;
}

export interface Notification {
  id: string;
  business_id: string;
  recipient_type: 'CUSTOMER' | 'STAFF' | 'BUSINESS';
  recipient_contact: string;
  channel: 'EMAIL' | 'WHATSAPP' | 'SMS';
  title: string;
  message: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  created_at: string;
}


// Legacy compatibility types for previous restaurant prototype components
export interface SaaSPlan {
  id: string;
  name: string;
  slug?: string;
  monthly_price: number;
  annual_price?: number;
  max_tables: number;
  max_branches?: number;
  features: string[];
  is_active: boolean;
}

export interface SaaSSubscription {
  id: string;
  restaurant_id: string;
  restaurant_name: string;
  plan_id: string;
  plan_name: string;
  status: string;
  monthly_amount: number;
  current_period_end: string;
}

export interface StaffMember {
  id: string;
  name?: string;
  full_name?: string;
  email?: string;
  avatar_url?: string;
  restaurant_id?: string;
  role: string;
  pin_code?: string;
  assigned_tables?: string[];
  is_active: boolean;
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  description?: string;
  cuisine_type?: string;
  phone?: string;
  address?: string;
  opening_hours: string;
  rating: number;
  review_count: number;
  currency: string;
  currency_symbol: string;
  tax_rate: number;
  service_charge_rate: number;
  wifi_ssid?: string;
  wifi_password?: string;
  is_active: boolean;
  is_suspended: boolean;
  plan_id?: string;
  created_at: string;
}

export interface Branch {
  id: string;
  restaurant_id: string;
  branch_name: string;
  branch_code: string;
  address?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
}

export interface RestaurantTable {
  id: string;
  restaurant_id: string;
  branch_id?: string;
  table_number: string;
  capacity: number;
  secure_token: string;
  is_active: boolean;
  total_scans?: number;
  active_orders_count?: number;
  created_at: string;
}

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  slug: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_available: boolean;
  is_popular?: boolean;
  is_veg?: boolean;
  kitchen_station?: string;
  preparation_time_minutes?: number;
  variants?: ItemVariant[];
  addons?: ItemAddon[];
  dietary_tags?: string[];
  created_at?: string;
}

export interface OrderItem {
  id: string;
  order_id?: string;
  menu_item_id?: string;
  item_name: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  selected_variant?: string;
  selected_addons?: string[];
  special_instructions?: string;
  kitchen_notes?: string;
}

export interface Order {
  id: string;
  order_number: string;
  restaurant_id: string;
  branch_id?: string;
  table_id: string;
  table_number: string;
  customer_name: string;
  customer_phone?: string;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  subtotal_amount?: number;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  currency?: string;
  currency_symbol?: string;
  items: OrderItem[];
  kitchen_station?: string;
  special_instructions?: string;
  server_name?: string;
  placed_at: string;
  acknowledged_at?: string;
  prep_started_at?: string;
  preparation_elapsed_seconds?: number;
  ready_at?: string;
  served_at?: string;
  completed_at?: string;
  overdue?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CashCollection {
  id: string;
  receipt_number: string;
  restaurant_id: string;
  branch_id?: string;
  order_id: string;
  order_number: string;
  table_number: string;
  customer_name?: string;
  amount_collected?: number;
  amount: number;
  payment_method: string;
  collected_by: string;
  collected_at: string;
  notes?: string;
}

export interface InventoryItem {
  id: string;
  restaurant_id: string;
  name: string;
  unit: string;
  current_stock: number;
  minimum_stock: number;
  unit_cost: number;
  updated_at: string;
}

export interface Expense {
  id: string;
  restaurant_id: string;
  branch_id?: string;
  category: string;
  amount: number;
  description: string;
  incurred_at: string;
}


export type OrderStatus = 
  | 'PENDING'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY'
  | 'SERVED'
  | 'COMPLETED'
  | 'CANCELLED';

export type PaymentStatus = 
  | 'UNPAID'
  | 'PAID'
  | 'REFUNDED';

export type PaymentMethod = 
  | 'CASH'
  | 'UPI'
  | 'CARD';

export type KitchenStation = 
  | 'Hot Line'
  | 'Grill'
  | 'Cold Kitchen'
  | 'Beverage Bar'
  | 'Dessert';

export interface ItemVariant {
  id: string;
  menu_item_id?: string;
  name: string;
  price_modifier: number;
}


export interface ItemAddon {
  id: string;
  menu_item_id?: string;
  name: string;
  price: number;
}


// AutoPay Verification and Subscription Separation Types (Phase 9)
export type AutoPayRefundStatus =
  | 'NOT_REQUIRED'
  | 'AUTHORIZATION_PENDING'
  | 'MANDATE_CONFIRMED'
  | 'REFUND_PENDING'
  | 'REFUND_PROCESSED'
  | 'AUTHORIZATION_FAILED'
  | 'REFUND_FAILED';

export interface AutoPayVerificationRecord {
  id: string; // autopay_${businessId}
  business_id: string;
  user_id: string;
  authorization_ref: string;
  payment_method: 'emandate' | 'card' | 'upi' | 'netbanking' | 'other';
  verification_deduction_amount: number; // e.g. 2 or 0
  verification_payment_ref?: string | null;
  automatic_refund_ref?: string | null;
  refund_status: AutoPayRefundStatus;
  mandate_status: 'AUTHORIZED' | 'PENDING' | 'FAILED' | 'CANCELLED';
  authorization_date: string;
  refund_date?: string | null;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface IntegrationHealthService {
  name: string;
  category: 'DATABASE' | 'AUTH' | 'STORAGE' | 'PAYMENT' | 'AI' | 'NOTIFICATIONS' | 'BACKEND';
  status: 'OPERATIONAL' | 'CONFIGURED' | 'NOT_CONFIGURED' | 'DEGRADED';
  isConfigured: boolean;
  lastVerifiedAt: string;
  latencyMs?: number | null;
  error?: string | null;
  troubleshooting?: string;
}

// Customer AI Smart Booking Assistant Types (Phase 8)
export type CustomerAIOption =
  | 'home'
  | 'book'
  | 'explore'
  | 'my-appointments'
  | 'reschedule'
  | 'cancel'
  | 'chat'
  | 'classic';

export interface CustomerPreferences {
  id: string; // pref_${business_id}_${phone}
  business_id: string;
  customer_phone: string;
  customer_name?: string;
  customer_email?: string;
  preferred_service_id?: string | null;
  preferred_service_name?: string | null;
  preferred_staff_id?: string | null;
  preferred_staff_name?: string | null;
  preferred_time_of_day?: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'ANY';
  consent_given: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerAIChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  suggestion_chips?: Array<{
    label: string;
    action: 'SELECT_SERVICE' | 'EXPLORE_SERVICES' | 'VIEW_SLOTS' | 'MY_APPOINTMENTS' | 'RESCHEDULE' | 'CANCEL' | 'CONTACT_BUSINESS';
    payload?: any;
  }>;
  timestamp: string;
}

export interface CustomerAppointmentSummary {
  id: string;
  booking_reference: string;
  management_token: string;
  business_id: string;
  service_id: string;
  service_name: string;
  service_price: number;
  duration_minutes: number;
  staff_id?: string | null;
  staff_name?: string | null;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  is_reviewed?: boolean;
  can_reschedule: boolean;
  can_cancel: boolean;
  created_at: string;
}

export interface CustomerBusinessSnapshot {
  businessId: string;
  businessName: string;
  slug: string;
  category: string;
  description?: string | null;
  address?: string | null;
  city?: string;
  phone?: string;
  email?: string;
  website?: string | null;
  logoUrl?: string | null;
  averageRating: number;
  totalReviews: number;
  slotIntervalMinutes: number;
  bufferMinutes: number;
  minAdvanceHours: number;
  maxAdvanceDays: number;
  cancellationPolicy: string;
  reschedulingPolicy: string;
  services: Array<{
    id: string;
    name: string;
    price: number;
    durationMinutes: number;
    description?: string | null;
    imageUrl?: string | null;
    category?: string | null;
  }>;
  staff: Array<{
    id: string;
    name: string;
    role?: string;
    isAvailable: boolean;
  }>;
  openingHoursDescription: string;
}

export interface CustomerServiceRequest {
  id: string;
  restaurant_id: string;
  branch_id?: string;
  table_number: string;
  type: 'CALL_WAITER' | 'BILL_REQUEST' | 'REQUEST_BILL' | 'WAITER' | 'WATER' | 'BILL' | 'CLEAR' | 'CUSTOM';
  status: 'PENDING' | 'ACKNOWLEDGED' | 'RESOLVED';
  created_at: string;
  acknowledged_at?: string;
  resolved_at?: string;
}
