-- ═══════════════════════════════════════════════════════════════════════════════
--  FLODON CRM — Database Schema (CRM Frontend Only)
--  Version 2.0.0
--  Idempotent: all IF NOT EXISTS / IF EXISTS / ON CONFLICT DO NOTHING
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─── 1. EXTENSION ────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ═══════════════════════════════════════════════════════════════════════════════
--  2. CORE — Profiles, Companies, Clients
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 2.1 PROFILES ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username    TEXT,
  full_name   TEXT,
  email       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 2.2 COMPANIES ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.companies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  industry    TEXT,
  website     TEXT,
  size        TEXT,
  country     TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 2.3 CLIENTS (Leads / CRM) ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.clients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  brand_name      TEXT,
  email           TEXT,
  phone           TEXT,
  website         TEXT,
  pipeline_stage  TEXT DEFAULT 'prospect',
  lead_source     TEXT DEFAULT 'website',
  source          TEXT DEFAULT 'manual',
  qualification   JSONB DEFAULT '{}',
  pipeline_data   JSONB DEFAULT '{}',
  booked_date     TEXT,
  booked_start    TEXT,
  booked_end      TEXT,
  company_id      UUID REFERENCES public.companies(id),
  role            TEXT,
  industry        TEXT,
  notes           TEXT,
  service         TEXT,
  ai_confirmed    BOOLEAN DEFAULT NULL,
  is_nurture      BOOLEAN DEFAULT FALSE,
  added_by        UUID REFERENCES public.profiles(id),
  lead_score      INTEGER DEFAULT 0,
  lead_score_updated_at TIMESTAMPTZ,
  lead_score_factors JSONB DEFAULT '{}',
  churn_risk      NUMERIC DEFAULT 0,
  churn_risk_updated_at TIMESTAMPTZ,
  churn_risk_factors JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════════
--  3. SALES — Deals, Expenses, Calls
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 3.1 DEALS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.deals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID REFERENCES public.clients(id),
  client_name     TEXT,
  company         TEXT,
  title           TEXT,
  amount_monthly  NUMERIC DEFAULT 0,
  venture         TEXT,
  stage           TEXT DEFAULT 'lead',
  probability     INTEGER DEFAULT 50,
  expected_close  DATE,
  source          TEXT DEFAULT 'manual',
  custom_offer    JSONB DEFAULT '{}',
  notes           TEXT,
  assigned_to     UUID REFERENCES public.profiles(id),
  logged_by       TEXT,
  logged_by_id    TEXT,
  logged_at       TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  cogs_monthly    NUMERIC DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_deals_logged_at ON public.deals(logged_at);

-- ─── 3.2 EXPENSES ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.expenses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount          NUMERIC NOT NULL DEFAULT 0,
  category        TEXT NOT NULL DEFAULT 'other',
  description     TEXT,
  date            DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date);

-- ─── 3.3 CALLS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.calls (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID REFERENCES public.clients(id),
  deal_id         UUID REFERENCES public.deals(id),
  prospect_name   TEXT,
  company         TEXT,
  status          TEXT DEFAULT 'booked',
  source          TEXT DEFAULT 'manual',
  outcome         TEXT,
  scheduled_at    TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  booked_date     TEXT,
  booked_start    TEXT,
  booked_end      TEXT,
  start_time      TEXT,
  end_time        TEXT,
  logged_by       TEXT,
  logged_by_id    TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════════
--  4. OPERATIONS — Activity Log, Email Queue
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 4.1 ACTIVITY LOG ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.activity_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action        TEXT,
  entity_type   TEXT,
  entity_id     UUID,
  metadata      JSONB DEFAULT '{}',
  profile_id    UUID REFERENCES public.profiles(id),
  ip_address    TEXT,
  user_agent    TEXT,
  title         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_action ON public.activity_log(action);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON public.activity_log(entity_type, entity_id);

-- ─── 4.2 EMAIL QUEUE ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.email_queue (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           UUID REFERENCES public.clients(id),
  deal_id             UUID REFERENCES public.deals(id),
  call_id             UUID REFERENCES public.calls(id),
  type                TEXT NOT NULL,
  status              TEXT DEFAULT 'queued',
  subject             TEXT,
  html_body           TEXT,
  scheduled_at        TIMESTAMPTZ NOT NULL,
  sent_at             TIMESTAMPTZ,
  resend_message_id   TEXT,
  error_message       TEXT,
  client_name         TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════════
--  5. CRM INTELLIGENCE — Lead Score Events, Churn Predictions
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.lead_score_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  score           INTEGER NOT NULL,
  factors         JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_score_events_client ON public.lead_score_events(client_id);

CREATE TABLE IF NOT EXISTS public.churn_predictions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  risk_score      NUMERIC NOT NULL,
  factors         JSONB DEFAULT '{}',
  model_version   TEXT DEFAULT 'v1',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_churn_predictions_client ON public.churn_predictions(client_id);

-- ═══════════════════════════════════════════════════════════════════════════════
--  6. PROJECTS — Client-facing project tracking
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 5.1 PROJECTS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  deal_id       UUID REFERENCES deals(id) ON DELETE SET NULL,
  name          TEXT NOT NULL,
  description   TEXT,
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','on_hold','completed','cancelled')),
  assigned_team TEXT[] DEFAULT '{}',
  start_date    DATE,
  target_date   DATE,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- ═══════════════════════════════════════════════════════════════════════════════
--  6. ACCESS & CONFIG — Settings
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 6.1 SETTINGS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL DEFAULT '',
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════════
--  7. SCHEMA ENHANCEMENTS — ALTER TABLE additions
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

UPDATE public.deals
SET
  created_at = COALESCE(created_at, logged_at, updated_at, NOW()),
  updated_at = COALESCE(updated_at, logged_at, created_at, NOW()),
  logged_at  = COALESCE(logged_at, created_at, updated_at, NOW())
WHERE created_at IS NULL OR updated_at IS NULL OR logged_at IS NULL;

ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS cogs_monthly NUMERIC DEFAULT 0;

-- ═══════════════════════════════════════════════════════════════════════════════
--  8. REALTIME PUBLICATIONS
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.deals;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.email_queue;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_log;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
--  9. ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth users can manage projects' AND tablename = 'projects') THEN
    CREATE POLICY "Auth users can manage projects" ON projects FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
--  10. SEED DATA
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.profiles (id, username, full_name, email)
VALUES ('00000000-0000-0000-0000-000000000001', 'admin', 'CRM Admin', 'admin@flodon.in')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.settings (key, value) VALUES
  ('gmail_user', ''),
  ('gmail_app_password', ''),
  ('gmail_from_name', 'Flodon Operations'),
  ('admin_email', ''),
  ('email_queue_min_delay_minutes', '5'),
  ('email_queue_max_delay_minutes', '45'),
  ('resend_api_key', ''),
  ('resend_from_email', 'Sanskar at FLODON <hello@flodon.in>'),
  ('anthropic_api_key', ''),
  ('twilio_account_sid', ''),
  ('twilio_auth_token', ''),
  ('twilio_whatsapp_number', '')
ON CONFLICT (key) DO NOTHING;

COMMIT;
