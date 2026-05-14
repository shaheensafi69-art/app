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
