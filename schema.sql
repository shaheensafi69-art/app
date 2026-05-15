-- Run this in your Supabase SQL Editor to fix database errors and set up the schema properly:

-- 1. Create the profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  first_name text,
  last_name text,
  phone_number text,
  image_url text,
  date_of_birth text,
  nationality text,
  country_residence text,
  kyc_status text default 'pending',
  sumsub_id text,
  stripe_customer_id text,
  stripe_cardholder_id text,
  billing_address jsonb,
  residential_address jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Ensure RLS is enabled and policies allow authenticated users
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- Optionally, service role can do everything
CREATE POLICY "Service role can perform all on profiles"
ON public.profiles FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3. In case you have an old trigger that is failing when you create users directly in the dashboard
-- We drop it, or recreate a safe one:
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create a robust trigger function that won't fail if first_name is missing
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'first_name', 
    new.raw_user_meta_data->>'last_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


CREATE TABLE IF NOT EXISTS public.user_devices (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  device_name text,
  device_id text not null unique,
  fcm_token text,
  last_login timestamp with time zone default timezone('utc'::text, now()),
  is_biometric_enabled boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

CREATE TABLE IF NOT EXISTS public.cards (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  stripe_card_id text not null,
  last4 text,
  brand text,
  status text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  exp_month numeric,
  exp_year numeric,
  type text
);

CREATE TABLE IF NOT EXISTS public.company_revenue (
  id uuid default gen_random_uuid() primary key,
  amount numeric not null,
  currency text not null,
  source_transaction_id text,
  service_type text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

CREATE TABLE IF NOT EXISTS public.gift_cards (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  code text not null unique,
  amount numeric not null,
  currency text not null,
  is_redeemed boolean default false,
  redeemed_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expiry_date timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  wallet_id uuid,
  stripe_transaction_id text,
  amount numeric not null,
  type text not null,
  description text,
  status text default 'completed',
  vendor_name text,
  exchange_rate numeric,
  related_transaction_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

CREATE TABLE IF NOT EXISTS public.withdrawals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount numeric not null,
  currency text not null,
  bank_details jsonb,
  fee numeric default 0,
  status text default 'pending',
  admin_note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);


CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text,
  body text,
  type text,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);


CREATE TABLE IF NOT EXISTS public.otp_codes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  code text not null,
  type text,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);


CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  subject text not null,
  message text not null,
  status text default 'open',
  priority text default 'normal',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id uuid default gen_random_uuid() primary key,
  ticket_id uuid references public.support_tickets(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  message text not null,
  is_admin_reply boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);


CREATE TABLE IF NOT EXISTS public.topup_orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  operator_name text,
  service_type text,
  target_number text,
  amount_spent numeric not null,
  currency text not null,
  status text default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);


CREATE TABLE IF NOT EXISTS public.wallets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  currency text not null,
  balance numeric default 0.00,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);
