-- ═══════════════════════════════════════════════════════════
--  FLODON INTERNAL SOFTWARE — Complete Database Schema
--  Run this in your Supabase SQL Editor (once per setup)
-- ═══════════════════════════════════════════════════════════

-- ─── 1. CLIENTS (Leads / CRM) ─────────────────────────────
-- Used by: /leads, /webleads, /recent-leads, warroom, webhooks
CREATE TABLE IF NOT EXISTS clients (
  id              BIGSERIAL PRIMARY KEY,
  name            TEXT NOT NULL,
  brand_name      TEXT,
  email           TEXT,
  phone           TEXT,
  website         TEXT,
  pipeline_stage  TEXT DEFAULT 'lead',
  lead_source     TEXT DEFAULT 'website',
  qualification   JSONB DEFAULT '{}',
  booked_date     TEXT,
  booked_start    TEXT,
  booked_end      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 2. DEALS ──────────────────────────────────────────────
-- Used by: /deal, warroom MRR calc, milestone checks
CREATE TABLE IF NOT EXISTS deals (
  id              BIGSERIAL PRIMARY KEY,
  client_name     TEXT NOT NULL,
  company         TEXT,
  amount_monthly  NUMERIC DEFAULT 0,
  venture         TEXT,
  notes           TEXT,
  logged_by       TEXT,
  logged_by_id    TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 3. CALLS ──────────────────────────────────────────────
-- Used by: /call, warroom call stats
CREATE TABLE IF NOT EXISTS calls (
  id              BIGSERIAL PRIMARY KEY,
  prospect_name   TEXT NOT NULL,
  company         TEXT,
  status          TEXT DEFAULT 'booked',
  source          TEXT DEFAULT 'manual',
  outcome         TEXT,
  scheduled_at    TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  logged_by       TEXT,
  logged_by_id    TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 4. OUTREACH ───────────────────────────────────────────
-- Used by: /outreach, warroom outreach stats
CREATE TABLE IF NOT EXISTS outreach (
  id              BIGSERIAL PRIMARY KEY,
  platform        TEXT NOT NULL,
  sent_count      INTEGER DEFAULT 0,
  reply_count     INTEGER DEFAULT 0,
  logged_by       TEXT,
  logged_by_id    TEXT,
  logged_at       DATE DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 5. PAYMENTS ───────────────────────────────────────────
-- Used by: /payment
CREATE TABLE IF NOT EXISTS payments (
  id              BIGSERIAL PRIMARY KEY,
  client_name     TEXT NOT NULL,
  amount          NUMERIC DEFAULT 0,
  provider        TEXT DEFAULT 'manual',
  type            TEXT DEFAULT 'renewal',
  received_at     TIMESTAMPTZ,
  logged_by       TEXT,
  logged_by_id    TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 6. CHURN ──────────────────────────────────────────────
-- Used by: /churn, warroom churn calc
CREATE TABLE IF NOT EXISTS churn (
  id              BIGSERIAL PRIMARY KEY,
  client_name     TEXT NOT NULL,
  amount_monthly  NUMERIC DEFAULT 0,
  reason          TEXT DEFAULT 'other',
  notes           TEXT,
  logged_by       TEXT,
  logged_by_id    TEXT,
  churned_at      TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 7. MILESTONES CELEBRATED ──────────────────────────────
-- Used by: checkMilestones() — prevents duplicate celebrations
CREATE TABLE IF NOT EXISTS milestones_celebrated (
  id              BIGSERIAL PRIMARY KEY,
  amount          NUMERIC NOT NULL UNIQUE,
  celebrated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 8. PROFILES (used by /status health check) ────────────
CREATE TABLE IF NOT EXISTS profiles (
  id              BIGSERIAL PRIMARY KEY,
  username        TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 9. SETTINGS (Dashboard Configuration) ─────────────────
-- Used by: dashboard email config, resend.js dynamic config
CREATE TABLE IF NOT EXISTS settings (
  key             TEXT PRIMARY KEY,
  value           TEXT NOT NULL DEFAULT '',
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default email configuration
INSERT INTO settings (key, value) VALUES
  ('gmail_user', ''),
  ('gmail_app_password', ''),
  ('gmail_from_name', 'Flodon Operations'),
  ('admin_email', '')
ON CONFLICT (key) DO NOTHING;
