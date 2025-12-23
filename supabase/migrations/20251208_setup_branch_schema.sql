-- ============================================
-- Migration: Setup Branch Schema
-- Date: 2025-12-08
-- Description: Create all tables, functions, triggers, RLS policies for soccer-jersey branch
-- ============================================

-- ============================================
-- 1. CREATE TABLES
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id uuid NOT NULL,
  first_name text,
  last_name text,
  email text NOT NULL,
  phone text,
  club_name text,
  address_line1 text,
  city text,
  state text,
  zip_code text,
  country text,
  full_name text,
  email_order text,
  created_at timestamptz,
  PRIMARY KEY (user_id)
);

-- Table: user_files
CREATE TABLE IF NOT EXISTS public.user_files (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  owner uuid,
  bucket_id text,
  name text,
  created_at timestamptz,
  updated_at timestamptz,
  last_accessed_at timestamptz,
  metadata jsonb,
  design_metadata jsonb,
  custom_name text,
  user_metadata jsonb,
  short_code text,
  design_name text,
  order_placed smallint DEFAULT '0'::smallint,
  product_type text DEFAULT 'socks'::text,
  PRIMARY KEY (id)
);

-- Table: user_orders
CREATE TABLE IF NOT EXISTS public.user_orders (
  order_id uuid DEFAULT uuid_generate_v4() NOT NULL,
  user_id uuid,
  date timestamptz DEFAULT CURRENT_TIMESTAMP,
  full_name text NOT NULL,
  email_order text NOT NULL,
  total_quantity integer NOT NULL,
  order_items jsonb NOT NULL,
  status text DEFAULT 'pending'::text,
  product_type text DEFAULT 'socks'::text,
  PRIMARY KEY (order_id)
);

-- Table: admin_users
CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  user_id uuid NOT NULL,
  email text NOT NULL,
  added_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  added_by uuid,
  PRIMARY KEY (id)
);

-- ============================================
-- 2. CREATE CONSTRAINTS
-- ============================================

-- Foreign Keys (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_user_id_fkey'
  ) THEN
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_orders_user_id_fkey'
  ) THEN
    ALTER TABLE public.user_orders 
    ADD CONSTRAINT user_orders_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'admin_users_user_id_fkey'
  ) THEN
    ALTER TABLE public.admin_users 
    ADD CONSTRAINT admin_users_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'admin_users_added_by_fkey'
  ) THEN
    ALTER TABLE public.admin_users 
    ADD CONSTRAINT admin_users_added_by_fkey 
    FOREIGN KEY (added_by) REFERENCES auth.users(id);
  END IF;
END $$;

-- Check Constraints (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_files_custom_name_check'
  ) THEN
    ALTER TABLE public.user_files 
    ADD CONSTRAINT user_files_custom_name_check 
    CHECK (length(custom_name) < 100);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_product_type_files'
  ) THEN
    ALTER TABLE public.user_files 
    ADD CONSTRAINT check_product_type_files 
    CHECK (product_type IN ('socks', 'jersey'));
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_product_type_orders'
  ) THEN
    ALTER TABLE public.user_orders 
    ADD CONSTRAINT check_product_type_orders 
    CHECK (product_type IN ('socks', 'jersey'));
  END IF;
END $$;

-- Unique Constraints
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_key ON public.profiles(email);
CREATE UNIQUE INDEX IF NOT EXISTS user_files_short_code_key ON public.user_files(short_code);
CREATE UNIQUE INDEX IF NOT EXISTS admin_users_email_key ON public.admin_users(email);
-- Unique constraint for sync_user_files trigger to work with ON CONFLICT
-- This ensures one user_files entry per unique (name, bucket_id) combination
CREATE UNIQUE INDEX IF NOT EXISTS user_files_name_bucket_key ON public.user_files(name, bucket_id);

-- ============================================
-- 3. CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_files_product_type ON public.user_files(product_type);
CREATE INDEX IF NOT EXISTS idx_user_orders_product_type ON public.user_orders(product_type);

-- ============================================
-- 4. ENABLE RLS
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. CREATE FUNCTIONS
-- ============================================

-- Function: generate_short_code()
CREATE OR REPLACE FUNCTION public.generate_short_code()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
    new_short_code TEXT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate a random 6-character code using lowercase letters and numbers
        new_short_code := lower(substring(md5(random()::text) from 1 for 6));
        
        -- Check if the generated code already exists
        SELECT EXISTS (
            SELECT 1 FROM public.user_files WHERE short_code = new_short_code
        ) INTO code_exists;
        
        -- If the code doesn't exist, use it and exit the loop
        IF NOT code_exists THEN
            EXIT;
        END IF;
    END LOOP;
    
    -- Update the new row with the generated short_code
    NEW.short_code := new_short_code;
    
    RETURN NEW;
END;
$function$;

-- Function: handle_new_user()
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name, email, created_at, phone, club_name, full_name, email_order)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'first_name', 
    NEW.raw_user_meta_data->>'last_name', 
    NEW.email,
    NEW.created_at::timestamptz,
    NEW.raw_user_meta_data->>'phone_number',
    NEW.raw_user_meta_data->>'club_name',
    (NEW.raw_user_meta_data->>'first_name') || ' ' || (NEW.raw_user_meta_data->>'last_name'),
    NEW.email
  );
  RETURN NEW;
END;
$function$;

-- Function: sync_user_files()
-- Purpose: Syncs storage.objects with user_files table
-- Trigger: sync_user_files_trigger (on storage.objects)
-- Note: SECURITY DEFINER allows the trigger to bypass RLS policies
CREATE OR REPLACE FUNCTION public.sync_user_files()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    -- Only sync files from public-bucket to avoid syncing system files
    IF NEW.bucket_id = 'public-bucket' THEN
      INSERT INTO public.user_files (owner, bucket_id, name, created_at, updated_at, last_accessed_at, metadata, user_metadata, product_type)
      VALUES (NEW.owner, NEW.bucket_id, NEW.name, NEW.created_at, NEW.updated_at, NEW.last_accessed_at, NEW.metadata, NEW.user_metadata, 'socks')
      ON CONFLICT (name, bucket_id) DO UPDATE SET
        owner = EXCLUDED.owner,
        bucket_id = EXCLUDED.bucket_id,
        name = EXCLUDED.name,
        created_at = EXCLUDED.created_at,
        updated_at = EXCLUDED.updated_at,
        last_accessed_at = EXCLUDED.last_accessed_at,
        metadata = EXCLUDED.metadata,
        user_metadata = EXCLUDED.user_metadata;
        -- Note: product_type is NOT updated on conflict to preserve existing value
    END IF;
  ELSIF (TG_OP = 'DELETE') THEN
    -- Only delete if it's from public-bucket
    IF OLD.bucket_id = 'public-bucket' THEN
      DELETE FROM public.user_files WHERE name = OLD.name AND bucket_id = OLD.bucket_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

-- ============================================
-- 6. CREATE TRIGGERS
-- ============================================

-- Trigger: generate_short_code_trigger
DROP TRIGGER IF EXISTS generate_short_code_trigger ON public.user_files;
CREATE TRIGGER generate_short_code_trigger
  BEFORE INSERT ON public.user_files
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_short_code();

-- Trigger: handle_new_user_trigger (on auth.users)
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;
CREATE TRIGGER handle_new_user_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger: sync_user_files_trigger (on storage.objects)
-- This trigger automatically creates/updates user_files entries when files are uploaded to storage
DROP TRIGGER IF EXISTS sync_user_files_trigger ON storage.objects;
CREATE TRIGGER sync_user_files_trigger
  AFTER INSERT OR UPDATE OR DELETE ON storage.objects
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_files();

-- ============================================
-- 7. CREATE RLS POLICIES
-- ============================================

-- ============================================
-- profiles table policies
-- ============================================

-- Users can select their own profiles
DROP POLICY IF EXISTS "Users can select their own profiles" ON public.profiles;
CREATE POLICY "Users can select their own profiles"
ON public.profiles FOR SELECT
USING (user_id = auth.uid());

-- Users can insert their own profiles
DROP POLICY IF EXISTS "Users can insert their own profiles" ON public.profiles;
CREATE POLICY "Users can insert their own profiles"
ON public.profiles FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can update their own profiles
DROP POLICY IF EXISTS "Users can update their own profiles" ON public.profiles;
CREATE POLICY "Users can update their own profiles"
ON public.profiles FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can delete their own profiles
DROP POLICY IF EXISTS "Users can delete their own profiles" ON public.profiles;
CREATE POLICY "Users can delete their own profiles"
ON public.profiles FOR DELETE
USING (user_id = auth.uid());

-- Admin can read all profiles
DROP POLICY IF EXISTS "Admin can read all profiles" ON public.profiles;
CREATE POLICY "Admin can read all profiles"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.user_id = auth.uid()
  )
);

-- ============================================
-- user_files table policies
-- ============================================

-- Users can read their own user_files
DROP POLICY IF EXISTS "Users can read their own user_files" ON public.user_files;
CREATE POLICY "Users can read their own user_files"
ON public.user_files FOR SELECT
USING (auth.uid() = owner);

-- Users can insert their own user_files
DROP POLICY IF EXISTS "Users can insert their own user_files" ON public.user_files;
CREATE POLICY "Users can insert their own user_files"
ON public.user_files FOR INSERT
WITH CHECK (auth.uid() = owner);

-- Users can update their own user_files
DROP POLICY IF EXISTS "Users can update their own user_files" ON public.user_files;
CREATE POLICY "Users can update their own user_files"
ON public.user_files FOR UPDATE
USING (auth.uid() = owner)
WITH CHECK (auth.uid() = owner);

-- Users can delete their own user_files
DROP POLICY IF EXISTS "Users can delete their own user_files" ON public.user_files;
CREATE POLICY "Users can delete their own user_files"
ON public.user_files FOR DELETE
USING (auth.uid() = owner);

-- Admin can read all Designs
DROP POLICY IF EXISTS "Admin can read all Designs" ON public.user_files;
CREATE POLICY "Admin can read all Designs"
ON public.user_files FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.user_id = auth.uid()
  )
);

-- ============================================
-- user_orders table policies
-- ============================================

-- Users can read their own orders
DROP POLICY IF EXISTS "Users can read their own orders" ON public.user_orders;
CREATE POLICY "Users can read their own orders"
ON public.user_orders FOR SELECT
USING (user_id = auth.uid());

-- Users can insert their own orders
DROP POLICY IF EXISTS "Users can insert their own orders" ON public.user_orders;
CREATE POLICY "Users can insert their own orders"
ON public.user_orders FOR INSERT
WITH CHECK (user_id = auth.uid());

-- No updates allowed
DROP POLICY IF EXISTS "No updates allowed" ON public.user_orders;
CREATE POLICY "No updates allowed"
ON public.user_orders FOR UPDATE
USING (false);

-- No deletes allowed
DROP POLICY IF EXISTS "No deletes allowed" ON public.user_orders;
CREATE POLICY "No deletes allowed"
ON public.user_orders FOR DELETE
USING (false);

-- Admin can read all orders (note: keeping original typo "Amin")
DROP POLICY IF EXISTS "Amin can read all orders" ON public.user_orders;
CREATE POLICY "Amin can read all orders"
ON public.user_orders FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.user_id = auth.uid()
  )
);

-- ============================================
-- admin_users table policies
-- ============================================

-- Authenticated users can read admin_users
DROP POLICY IF EXISTS "Authenticated users can read admin_users" ON public.admin_users;
CREATE POLICY "Authenticated users can read admin_users"
ON public.admin_users FOR SELECT
USING (true);

-- No inserts allowed
DROP POLICY IF EXISTS "No inserts allowed" ON public.admin_users;
CREATE POLICY "No inserts allowed"
ON public.admin_users FOR INSERT
WITH CHECK (false);

-- No updates allowed
DROP POLICY IF EXISTS "No updates allowed" ON public.admin_users;
CREATE POLICY "No updates allowed"
ON public.admin_users FOR UPDATE
USING (false);

-- No deletes allowed
DROP POLICY IF EXISTS "No deletes allowed" ON public.admin_users;
CREATE POLICY "No deletes allowed"
ON public.admin_users FOR DELETE
USING (false);

-- ============================================
-- Migration Complete
-- ============================================
