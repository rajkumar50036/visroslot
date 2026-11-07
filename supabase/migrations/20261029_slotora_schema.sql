-- ==============================================================================
-- SLOTORA MULTI-TENANT APPOINTMENT BOOKING SAAS SCHEMA
-- Migration: 20261029_slotora_schema.sql
-- ==============================================================================

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. PROFILES (Extends Supabase auth.users)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'OWNER' CHECK (role IN ('OWNER', 'STAFF', 'ADMIN')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index on email
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ==============================================================================
-- 2. SUBSCRIPTION PLANS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id TEXT PRIMARY KEY, -- 'free', 'starter', 'growth', 'business'
  name TEXT NOT NULL,
  price_monthly NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  max_bookings_per_month INTEGER NOT NULL,
  max_staff_members INTEGER NOT NULL,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed standard subscription plans
INSERT INTO public.subscription_plans (id, name, price_monthly, currency, max_bookings_per_month, max_staff_members, features)
VALUES 
  ('free', 'Free Forever', 0, 'INR', 50, 1, '["50 bookings/month", "1 staff member", "Online booking page", "Appointment calendar", "Customer database"]'::jsonb),
  ('starter', 'Starter', 299, 'INR', 300, 3, '["300 bookings/month", "3 staff members", "Automated reminders", "Online booking page", "Appointment calendar", "Customer database"]'::jsonb),
  ('growth', 'Growth', 699, 'INR', 10000, 10, '["Unlimited bookings", "10 staff members", "WhatsApp integration", "Advanced analytics", "Automated reminders"]'::jsonb),
  ('business', 'Business', 1499, 'INR', 50000, 25, '["Unlimited bookings", "25 staff members", "Multiple branches", "Advanced automation", "Dedicated account manager"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price_monthly = EXCLUDED.price_monthly,
  max_bookings_per_month = EXCLUDED.max_bookings_per_month,
  max_staff_members = EXCLUDED.max_staff_members,
  features = EXCLUDED.features;

-- ==============================================================================
-- 3. BUSINESSES (Tenant Root)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL, -- e.g. 'Salon & Spa', 'Dental Clinic', 'Fitness Studio', 'Consulting'
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  city TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'India',
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  currency TEXT NOT NULL DEFAULT 'INR',
  currency_symbol TEXT NOT NULL DEFAULT '₹',
  description TEXT,
  logo_url TEXT,
  slot_interval_minutes INTEGER NOT NULL DEFAULT 30 CHECK (slot_interval_minutes >= 10 AND slot_interval_minutes <= 240),
  buffer_minutes INTEGER NOT NULL DEFAULT 0 CHECK (buffer_minutes >= 0 AND buffer_minutes <= 120),
  min_advance_hours INTEGER NOT NULL DEFAULT 2 CHECK (min_advance_hours >= 0),
  max_advance_days INTEGER NOT NULL DEFAULT 30 CHECK (max_advance_days >= 1 AND max_advance_days <= 180),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_businesses_owner ON public.businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON public.businesses(slug);

-- ==============================================================================
-- 4. SUBSCRIPTIONS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL UNIQUE REFERENCES public.businesses(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES public.subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED')),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 5. SERVICES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 30 CHECK (duration_minutes >= 5 AND duration_minutes <= 480),
  price NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_services_business ON public.services(business_id);
CREATE INDEX IF NOT EXISTS idx_services_active ON public.services(business_id, is_active);

-- ==============================================================================
-- 6. STAFF
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role_title TEXT NOT NULL DEFAULT 'Specialist',
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_business ON public.staff(business_id);

-- ==============================================================================
-- 7. STAFF_SERVICES (Many-to-Many)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.staff_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(staff_id, service_id)
);

CREATE INDEX IF NOT EXISTS idx_staff_services_staff ON public.staff_services(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_services_service ON public.staff_services(service_id);

-- ==============================================================================
-- 8. BUSINESS_HOURS (Weekly Schedule)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.business_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 1=Monday...
  is_open BOOLEAN NOT NULL DEFAULT true,
  open_time TIME NOT NULL DEFAULT '09:00:00',
  close_time TIME NOT NULL DEFAULT '19:00:00',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id, day_of_week)
);

CREATE INDEX IF NOT EXISTS idx_business_hours_schedule ON public.business_hours(business_id, day_of_week);

-- ==============================================================================
-- 9. BUSINESS_BREAKS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.business_breaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  label TEXT NOT NULL DEFAULT 'Break',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_business_breaks ON public.business_breaks(business_id, day_of_week);

-- ==============================================================================
-- 10. BUSINESS_HOLIDAYS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.business_holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  holiday_date DATE NOT NULL,
  reason TEXT NOT NULL DEFAULT 'Holiday Closure',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id, holiday_date)
);

CREATE INDEX IF NOT EXISTS idx_business_holidays_date ON public.business_holidays(business_id, holiday_date);

-- ==============================================================================
-- 11. CUSTOMERS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  notes TEXT,
  total_bookings INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id, email)
);

CREATE INDEX IF NOT EXISTS idx_customers_business ON public.customers(business_id);
CREATE INDEX IF NOT EXISTS idx_customers_lookup ON public.customers(business_id, email);

-- ==============================================================================
-- 12. APPOINTMENTS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  booking_reference TEXT NOT NULL UNIQUE,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),
  service_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  customer_notes TEXT,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointments_business ON public.appointments(business_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(business_id, appointment_date, status);
CREATE INDEX IF NOT EXISTS idx_appointments_ref ON public.appointments(booking_reference);

-- ==============================================================================
-- 13. NOTIFICATIONS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('CUSTOMER', 'STAFF', 'BUSINESS')),
  recipient_contact TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'EMAIL' CHECK (channel IN ('EMAIL', 'WHATSAPP', 'SMS')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'SENT' CHECK (status IN ('PENDING', 'SENT', 'FAILED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_business ON public.notifications(business_id);

-- ==============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_businesses_updated_at ON public.businesses;
CREATE TRIGGER set_businesses_updated_at BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_services_updated_at ON public.services;
CREATE TRIGGER set_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_staff_updated_at ON public.staff;
CREATE TRIGGER set_staff_updated_at BEFORE UPDATE ON public.staff FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_customers_updated_at ON public.customers;
CREATE TRIGGER set_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_appointments_updated_at ON public.appointments;
CREATE TRIGGER set_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- ATOMIC DOUBLE-BOOKING PREVENTION PROCEDURE
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.book_appointment(
  p_business_id UUID,
  p_service_id UUID,
  p_staff_id UUID,
  p_appointment_date DATE,
  p_start_time TIME,
  p_end_time TIME,
  p_customer_name TEXT,
  p_customer_email TEXT,
  p_customer_phone TEXT,
  p_customer_notes TEXT,
  p_booking_reference TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_customer_id UUID;
  v_appointment_id UUID;
  v_service_price NUMERIC(10,2);
  v_conflict_count INTEGER;
  v_is_holiday BOOLEAN;
  v_is_open BOOLEAN;
  v_dow SMALLINT;
BEGIN
  -- 1. Check if business is open on this day of week
  v_dow := EXTRACT(DOW FROM p_appointment_date)::SMALLINT;
  SELECT is_open INTO v_is_open FROM public.business_hours WHERE business_id = p_business_id AND day_of_week = v_dow;
  IF v_is_open IS NOT NULL AND v_is_open = false THEN
    RETURN jsonb_build_object('success', false, 'error', 'BUSINESS_CLOSED', 'message', 'The business is closed on this day.');
  END IF;

  -- 2. Check if date is a holiday
  SELECT EXISTS(SELECT 1 FROM public.business_holidays WHERE business_id = p_business_id AND holiday_date = p_appointment_date) INTO v_is_holiday;
  IF v_is_holiday THEN
    RETURN jsonb_build_object('success', false, 'error', 'HOLIDAY_CLOSURE', 'message', 'The business is closed for a holiday on this date.');
  END IF;

  -- 3. Get service price
  SELECT price INTO v_service_price FROM public.services WHERE id = p_service_id AND business_id = p_business_id AND is_active = true;
  IF v_service_price IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_SERVICE', 'message', 'Selected service was not found or is inactive.');
  END IF;

  -- 4. CRITICAL: Check for overlapping appointments with table lock / row existence check
  -- Two intervals [s1, e1) and [s2, e2) overlap if s1 < e2 AND s2 < e1
  SELECT COUNT(*) INTO v_conflict_count
  FROM public.appointments
  WHERE business_id = p_business_id
    AND appointment_date = p_appointment_date
    AND status IN ('CONFIRMED', 'PENDING')
    AND (p_staff_id IS NULL OR staff_id IS NULL OR staff_id = p_staff_id)
    AND (start_time < p_end_time AND end_time > p_start_time);

  IF v_conflict_count > 0 THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'SLOT_ALREADY_TAKEN', 
      'message', 'This time slot was just booked by another client. Please select another slot.'
    );
  END IF;

  -- 5. Upsert customer record
  INSERT INTO public.customers (business_id, full_name, email, phone, notes, total_bookings)
  VALUES (p_business_id, p_customer_name, p_customer_email, p_customer_phone, p_customer_notes, 1)
  ON CONFLICT (business_id, email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    total_bookings = public.customers.total_bookings + 1,
    updated_at = now()
  RETURNING id INTO v_customer_id;

  -- 6. Insert confirmed appointment atomically
  INSERT INTO public.appointments (
    business_id,
    service_id,
    staff_id,
    customer_id,
    booking_reference,
    appointment_date,
    start_time,
    end_time,
    status,
    service_price,
    customer_notes
  )
  VALUES (
    p_business_id,
    p_service_id,
    p_staff_id,
    v_customer_id,
    p_booking_reference,
    p_appointment_date,
    p_start_time,
    p_end_time,
    'CONFIRMED',
    v_service_price,
    p_customer_notes
  )
  RETURNING id INTO v_appointment_id;

  -- 7. Log notification
  INSERT INTO public.notifications (
    business_id,
    recipient_type,
    recipient_contact,
    channel,
    title,
    message,
    status
  )
  VALUES (
    p_business_id,
    'CUSTOMER',
    p_customer_email,
    'EMAIL',
    'Appointment Confirmation #' || p_booking_reference,
    'Your appointment has been confirmed for ' || p_appointment_date::TEXT || ' at ' || p_start_time::TEXT || '.',
    'SENT'
  );

  RETURN jsonb_build_object(
    'success', true,
    'appointment_id', v_appointment_id,
    'booking_reference', p_booking_reference,
    'customer_id', v_customer_id
  );
END;
$$;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_breaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES POLICIES
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. SUBSCRIPTION PLANS POLICIES (Publicly readable)
DROP POLICY IF EXISTS "Anyone can view plans" ON public.subscription_plans;
CREATE POLICY "Anyone can view plans" ON public.subscription_plans FOR SELECT USING (true);

-- 3. BUSINESSES POLICIES
-- Public can view active businesses by slug
DROP POLICY IF EXISTS "Public can view active businesses" ON public.businesses;
CREATE POLICY "Public can view active businesses" ON public.businesses FOR SELECT USING (is_active = true);

-- Owners can manage their business
DROP POLICY IF EXISTS "Owners can update own business" ON public.businesses;
CREATE POLICY "Owners can update own business" ON public.businesses FOR ALL USING (auth.uid() = owner_id);

-- 4. SUBSCRIPTIONS POLICIES
DROP POLICY IF EXISTS "Owners can view own subscription" ON public.subscriptions;
CREATE POLICY "Owners can view own subscription" ON public.subscriptions FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND owner_id = auth.uid()));

-- 5. SERVICES POLICIES
-- Public can view active services
DROP POLICY IF EXISTS "Public can view active services" ON public.services;
CREATE POLICY "Public can view active services" ON public.services FOR SELECT USING (is_active = true);

-- Owners can manage their services
DROP POLICY IF EXISTS "Owners can manage services" ON public.services;
CREATE POLICY "Owners can manage services" ON public.services FOR ALL
USING (EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND owner_id = auth.uid()));

-- 6. STAFF POLICIES
-- Public can view active staff
DROP POLICY IF EXISTS "Public can view active staff" ON public.staff;
CREATE POLICY "Public can view active staff" ON public.staff FOR SELECT USING (is_active = true);

-- Owners can manage staff
DROP POLICY IF EXISTS "Owners can manage staff" ON public.staff;
CREATE POLICY "Owners can manage staff" ON public.staff FOR ALL
USING (EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND owner_id = auth.uid()));

-- 7. STAFF_SERVICES POLICIES
DROP POLICY IF EXISTS "Public can view staff services" ON public.staff_services;
CREATE POLICY "Public can view staff services" ON public.staff_services FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owners can manage staff services" ON public.staff_services;
CREATE POLICY "Owners can manage staff services" ON public.staff_services FOR ALL
USING (EXISTS (SELECT 1 FROM public.staff s JOIN public.businesses b ON b.id = s.business_id WHERE s.id = staff_id AND b.owner_id = auth.uid()));

-- 8. BUSINESS HOURS & BREAKS POLICIES
DROP POLICY IF EXISTS "Public can view business hours" ON public.business_hours;
CREATE POLICY "Public can view business hours" ON public.business_hours FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owners can manage business hours" ON public.business_hours;
CREATE POLICY "Owners can manage business hours" ON public.business_hours FOR ALL
USING (EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND owner_id = auth.uid()));

DROP POLICY IF EXISTS "Public can view business breaks" ON public.business_breaks;
CREATE POLICY "Public can view business breaks" ON public.business_breaks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owners can manage business breaks" ON public.business_breaks;
CREATE POLICY "Owners can manage business breaks" ON public.business_breaks FOR ALL
USING (EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND owner_id = auth.uid()));

-- 9. BUSINESS HOLIDAYS POLICIES
DROP POLICY IF EXISTS "Public can view business holidays" ON public.business_holidays;
CREATE POLICY "Public can view business holidays" ON public.business_holidays FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owners can manage business holidays" ON public.business_holidays;
CREATE POLICY "Owners can manage business holidays" ON public.business_holidays FOR ALL
USING (EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND owner_id = auth.uid()));

-- 10. CUSTOMERS POLICIES
-- Private: Only business owners can view customer records
DROP POLICY IF EXISTS "Owners can view customers" ON public.customers;
CREATE POLICY "Owners can view customers" ON public.customers FOR ALL
USING (EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND owner_id = auth.uid()));

-- 11. APPOINTMENTS POLICIES
-- Owners can manage all appointments for their business
DROP POLICY IF EXISTS "Owners can manage appointments" ON public.appointments;
CREATE POLICY "Owners can manage appointments" ON public.appointments FOR ALL
USING (EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND owner_id = auth.uid()));

-- 12. NOTIFICATIONS POLICIES
DROP POLICY IF EXISTS "Owners can view notifications" ON public.notifications;
CREATE POLICY "Owners can view notifications" ON public.notifications FOR ALL
USING (EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND owner_id = auth.uid()));
