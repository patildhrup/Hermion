-- ============================================================
-- HERMION: Full Supabase Schema Setup
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. PROFILES  (linked to auth.users)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT,
  username    TEXT UNIQUE,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Anyone can check usernames"
  ON public.profiles FOR SELECT
  USING (true);

-- Auto-create profile on new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- 2. LEADS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.leads (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id             UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name                 TEXT NOT NULL,
  company              TEXT,
  contact_info         TEXT,
  qualification_score  INT DEFAULT 0,
  status               TEXT DEFAULT 'new' CHECK (status IN ('new','qualified','demo_booked','lost','escalated')),
  created_at           TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Allow any service-role or anon to do full CRUD (suitable for hackathon)
CREATE POLICY "Open leads for hackathon"
  ON public.leads FOR ALL
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 3. CALLS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.calls (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id              UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  agora_channel_name   TEXT,
  started_at           TIMESTAMPTZ DEFAULT NOW(),
  ended_at             TIMESTAMPTZ,
  duration_sec         INT DEFAULT 0,
  outcome              TEXT DEFAULT 'in_progress'
);

ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Open calls for hackathon"
  ON public.calls FOR ALL
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 4. TRANSCRIPTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.transcripts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id      UUID REFERENCES public.calls(id) ON DELETE CASCADE,
  speaker      TEXT NOT NULL CHECK (speaker IN ('prospect','hermion')),
  text         TEXT NOT NULL,
  timestamp_ms BIGINT
);

ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Open transcripts for hackathon"
  ON public.transcripts FOR ALL
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 5. CALL_SUMMARIES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.call_summaries (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id           UUID REFERENCES public.calls(id) ON DELETE CASCADE,
  summary_text      TEXT,
  next_steps        TEXT,
  objections_raised TEXT[] DEFAULT '{}',
  sentiment         TEXT DEFAULT 'neutral'
);

ALTER TABLE public.call_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Open summaries for hackathon"
  ON public.call_summaries FOR ALL
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- Enable Realtime for live dashboard updates
-- ─────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.calls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transcripts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_summaries;

-- ─────────────────────────────────────────────────────────────
-- Google OAuth: Configure in Supabase Dashboard > Auth > Providers > Google
-- Redirect URL: https://ixjbhxfzjggrusuxpojx.supabase.co/auth/v1/callback
-- ─────────────────────────────────────────────────────────────
