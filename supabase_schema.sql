-- =======================================================
-- Umrah Savings Tracker - Supabase SQL Schema
-- Project Reference: dnqeshylcqxpsetihsgg
-- =======================================================

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. User Settings Table
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  goal_amount NUMERIC DEFAULT 160000,
  currency TEXT DEFAULT 'BDT',
  theme TEXT DEFAULT 'light',
  language TEXT DEFAULT 'en',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Savings Entries Table
CREATE TABLE IF NOT EXISTS public.savings_entries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date TEXT NOT NULL,
  day TEXT NOT NULL,
  daily_money NUMERIC DEFAULT 0 NOT NULL,
  extra_money NUMERIC DEFAULT 0 NOT NULL,
  source TEXT DEFAULT 'Other',
  expense NUMERIC DEFAULT 0 NOT NULL,
  today_savings NUMERIC DEFAULT 0 NOT NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Islamic Motivational Quotes Table
CREATE TABLE IF NOT EXISTS public.quotes (
  id TEXT PRIMARY KEY,
  en TEXT NOT NULL,
  bn TEXT NOT NULL,
  source TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage own profile" ON public.profiles;

DROP POLICY IF EXISTS "Users can view own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can manage own settings" ON public.user_settings;

DROP POLICY IF EXISTS "Users can manage own savings entries" ON public.savings_entries;
DROP POLICY IF EXISTS "Anyone can read quotes" ON public.quotes;

-- Create RLS Policies
CREATE POLICY "Users can manage own profile"
  ON public.profiles FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can manage own settings"
  ON public.user_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own savings entries"
  ON public.savings_entries FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can read quotes"
  ON public.quotes FOR SELECT
  TO authenticated, anon
  USING (true);

-- Create Indexes for Fast Lookup
CREATE INDEX IF NOT EXISTS idx_savings_entries_user_id ON public.savings_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_entries_date ON public.savings_entries(date DESC);

-- Trigger for auto-creating profile and settings when a new user signs up in Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, photo_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'displayName', 'Explorer'),
    COALESCE(NEW.raw_user_meta_data->>'photo_url', NEW.raw_user_meta_data->>'photoURL', '')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_settings (user_id, goal_amount, currency, theme, language)
  VALUES (NEW.id, 160000, 'BDT', 'light', 'en')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
