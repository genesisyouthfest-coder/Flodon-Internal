-- ═══════════════════════════════════════════════════════════
--  FLODON INTERNAL — Complete Database Schema
--  Run this once in your Supabase SQL Editor (fresh project)
-- ═══════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── 1. PROFILES ───────────────────────────────────────────
-- Used by: CRM activity log, /status health check
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username    TEXT,
  full_name   TEXT,
  email       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.profiles (id, username, full_name, email)
VALUES ('00000000-0000-0000-0000-000000000001', 'admin', 'CRM Admin', 'admin@flodon.in')
ON CONFLICT (id) DO NOTHING;

-- ─── 2. COMPANIES ────────────────────────────────────────
-- Used by: CRM /crm companies, client linking
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

-- ─── 3. CLIENTS (Leads / CRM) ────────────────────────────
-- Used by: /leads, /webleads, /recent-leads, warroom, webhooks, CRM
CREATE TABLE IF NOT EXISTS public.clients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  brand_name      TEXT,
  email           TEXT,
  phone           TEXT,
  website         TEXT,
  pipeline_stage  TEXT DEFAULT 'lead',
  lead_source     TEXT DEFAULT 'website',
  source          TEXT DEFAULT 'manual',
  qualification   JSONB DEFAULT '{}',
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
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 4. DEALS ──────────────────────────────────────────────
-- Used by: /deal, warroom MRR, milestones, CRM pipeline
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
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 5. CALLS ──────────────────────────────────────────────
-- Used by: /call, warroom call stats, CRM calls
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

-- ─── 6. TASKS ──────────────────────────────────────────────
-- Used by: CRM tasks
CREATE TABLE IF NOT EXISTS public.tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT,
  status      TEXT DEFAULT 'pending',
  deadline    TIMESTAMPTZ,
  client_id   UUID REFERENCES public.clients(id),
  deal_id     UUID REFERENCES public.deals(id),
  call_id     UUID REFERENCES public.calls(id),
  assigned_to UUID REFERENCES public.profiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 7. OUTREACH ───────────────────────────────────────────
-- Used by: /outreach, warroom outreach stats
CREATE TABLE IF NOT EXISTS public.outreach (
  id              BIGSERIAL PRIMARY KEY,
  platform        TEXT NOT NULL,
  sent_count      INTEGER DEFAULT 0,
  reply_count     INTEGER DEFAULT 0,
  logged_by       TEXT,
  logged_by_id    TEXT,
  logged_at       DATE DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 8. PAYMENTS ───────────────────────────────────────────
-- Used by: /payment
CREATE TABLE IF NOT EXISTS public.payments (
  id              BIGSERIAL PRIMARY KEY,
  client_name     TEXT NOT NULL,
  amount          NUMERIC DEFAULT 0,
  provider        TEXT DEFAULT 'manual',
  type            TEXT DEFAULT 'renewal',
  received_at     TIMESTAMPTZ,
  logged_by       TEXT,
  logged_by_id    TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 9. CHURN ──────────────────────────────────────────────
-- Used by: /churn, warroom churn calc
CREATE TABLE IF NOT EXISTS public.churn (
  id              BIGSERIAL PRIMARY KEY,
  client_name     TEXT NOT NULL,
  amount_monthly  NUMERIC DEFAULT 0,
  reason          TEXT DEFAULT 'other',
  notes           TEXT,
  logged_by       TEXT,
  logged_by_id    TEXT,
  churned_at      TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 10. MILESTONES CELEBRATED ─────────────────────────────
-- Used by: checkMilestones() — prevents duplicate celebrations
CREATE TABLE IF NOT EXISTS public.milestones_celebrated (
  id              BIGSERIAL PRIMARY KEY,
  amount          NUMERIC NOT NULL UNIQUE,
  celebrated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 11. ACTIVITY LOG ──────────────────────────────────────
-- Used by: CRM dashboard, realtime feed
CREATE TABLE IF NOT EXISTS public.activity_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action        TEXT,
  entity_type   TEXT,
  entity_id     UUID,
  metadata      JSONB DEFAULT '{}',
  profile_id    UUID REFERENCES public.profiles(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 12. EMAIL QUEUE ───────────────────────────────────────
-- Used by: processEmailQueue(), CRM email queue UI
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
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 13. SETTINGS (Dashboard + CRM + Email Queue) ──────────
-- Used by: ops dashboard, resend.js, email queue processor
CREATE TABLE IF NOT EXISTS public.settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL DEFAULT '',
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

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

-- ─── 14. REALTIME (optional; safe to re-run) ───────────────
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.deals;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.email_queue;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_log;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
