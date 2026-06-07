-- ═══════════════════════════════════════════════════════════════════════════════
--  FLODON ENTERPRISE — Complete Database Schema
--  Version 1.0.0
--  Date: 2026-06-07
--
--  Combines: supabase.sql (base) + migrations 00002–00006
--  Idempotent: all IF NOT EXISTS / IF EXISTS / ON CONFLICT DO NOTHING
--  Atomic: safe to re-run on any Supabase project at any stage
--
--  TABLE OF CONTENTS
--    1.  EXTENSION
--    2.  CORE — profiles, companies, clients
--    3.  TAGGING — tags, taggings
--    4.  SALES — deals, calls, outreach, affiliates, referrals
--    5.  FINANCE — payments, churn, milestones_celebrated,
--                  stripe_customers, invoices, payment_attempts
--    6.  OPERATIONS — tasks, activity_log, email_queue,
--                     scheduled_reports, report_logs
--    7.  CRM INTELLIGENCE — lead_score_events, churn_predictions,
--                          anomalies, forecasts
--    8.  NURTURE — nurture_sequences, nurture_steps,
--                  nurture_subscriptions
--    9.  KNOWLEDGE BASE — kb_categories, kb_articles
--   10.  CLIENT PORTAL — portal_auth_tokens, portal_sessions,
--                        projects, project_milestones,
--                        portal_messages, portal_documents
--   11.  TIME TRACKING — time_entries, timers, time_reports
--   12.  ACCESS & CONFIG — api_keys, dashboard_widgets, settings
--   13.  SCHEMA ENHANCEMENTS — ALTER TABLE additions
--   14.  REALTIME PUBLICATIONS
--   15.  ROW LEVEL SECURITY
--   16.  SEED DATA
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════════
--  1. EXTENSION
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ═══════════════════════════════════════════════════════════════════════════════
--  2. CORE — Profiles, Companies, Clients
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 2.1 PROFILES ────────────────────────────────────────────────────────────
-- Used by: CRM activity log, /status health check
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username    TEXT,
  full_name   TEXT,
  email       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 2.2 COMPANIES ───────────────────────────────────────────────────────────
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

-- ─── 2.3 CLIENTS (Leads / CRM) ───────────────────────────────────────────────
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
--  3. TAGGING — Tags, Taggings
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 3.1 TAGS ────────────────────────────────────────────────────────────────
-- Used by: CRM knowledge base, polymorphic labeling
CREATE TABLE IF NOT EXISTS public.tags (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT UNIQUE NOT NULL,
  color           TEXT DEFAULT '#6366f1',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 3.2 TAGGINGS (Polymorphic) ──────────────────────────────────────────────
-- Used by: attaching tags to clients, deals, companies
CREATE TABLE IF NOT EXISTS public.taggings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id          UUID REFERENCES public.tags(id) ON DELETE CASCADE,
  taggable_id     UUID NOT NULL,
  taggable_type   TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_taggings ON public.taggings(taggable_type, taggable_id);

-- ═══════════════════════════════════════════════════════════════════════════════
--  4. SALES — Deals, Calls, Outreach, Affiliates, Referrals
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 4.1 DEALS ───────────────────────────────────────────────────────────────
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
  logged_at       TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deals_logged_at ON public.deals(logged_at);

-- ─── 4.2 CALLS ───────────────────────────────────────────────────────────────
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

-- ─── 4.3 OUTREACH ────────────────────────────────────────────────────────────
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

-- ─── 4.4 AFFILIATES ──────────────────────────────────────────────────────────
-- Used by: referral / affiliate tracking module
CREATE TABLE IF NOT EXISTS public.affiliates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  email           TEXT,
  referral_code   TEXT UNIQUE NOT NULL,
  commission_rate NUMERIC DEFAULT 0.1,
  total_earned    NUMERIC DEFAULT 0,
  total_paid      NUMERIC DEFAULT 0,
  status          TEXT DEFAULT 'active',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 4.5 REFERRALS ───────────────────────────────────────────────────────────
-- Used by: referral tracking, commission reconciliation
CREATE TABLE IF NOT EXISTS public.referrals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id    UUID REFERENCES public.affiliates(id) ON DELETE CASCADE,
  referred_client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  referral_code   TEXT NOT NULL,
  status          TEXT DEFAULT 'pending',
  commission_amount NUMERIC DEFAULT 0,
  deal_id         UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  converted_at    TIMESTAMPTZ,
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referrals_affiliate ON public.referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON public.referrals(referral_code);

-- ═══════════════════════════════════════════════════════════════════════════════
--  5. FINANCE — Payments, Churn, Milestones Celebrated,
--              Stripe Customers, Invoices, Payment Attempts
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 5.1 PAYMENTS ────────────────────────────────────────────────────────────
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

-- ─── 5.2 CHURN ───────────────────────────────────────────────────────────────
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

-- ─── 5.3 MILESTONES CELEBRATED ───────────────────────────────────────────────
-- Used by: checkMilestones() — prevents duplicate celebrations
CREATE TABLE IF NOT EXISTS public.milestones_celebrated (
  id              BIGSERIAL PRIMARY KEY,
  amount          NUMERIC NOT NULL UNIQUE,
  celebrated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 5.4 STRIPE CUSTOMERS ────────────────────────────────────────────────────
-- Used by: billing integration, subscription management
CREATE TABLE IF NOT EXISTS public.stripe_customers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  stripe_subscription_id TEXT,
  status          TEXT DEFAULT 'incomplete',
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  plan_amount     NUMERIC DEFAULT 0,
  plan_currency   TEXT DEFAULT 'inr',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_customers_client ON public.stripe_customers(client_id);

-- ─── 5.5 INVOICES ────────────────────────────────────────────────────────────
-- Used by: billing, revenue reconciliation
CREATE TABLE IF NOT EXISTS public.invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_customer_id UUID REFERENCES public.stripe_customers(id) ON DELETE CASCADE,
  client_id       UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT UNIQUE,
  amount          NUMERIC NOT NULL,
  currency        TEXT DEFAULT 'inr',
  status          TEXT DEFAULT 'draft',
  due_date        TIMESTAMPTZ,
  paid_at         TIMESTAMPTZ,
  invoice_pdf     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_client ON public.invoices(client_id);

-- ─── 5.6 PAYMENT ATTEMPTS ────────────────────────────────────────────────────
-- Used by: payment retry and failure tracking
CREATE TABLE IF NOT EXISTS public.payment_attempts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id      UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT,
  amount          NUMERIC NOT NULL,
  status          TEXT DEFAULT 'requires_payment_method',
  failure_reason  TEXT,
  attempt_number  INTEGER DEFAULT 1,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════════
--  6. OPERATIONS — Tasks, Activity Log, Email Queue,
--                  Scheduled Reports, Report Logs
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 6.1 TASKS ───────────────────────────────────────────────────────────────
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

-- ─── 6.2 ACTIVITY LOG ────────────────────────────────────────────────────────
-- Used by: CRM dashboard, realtime feed
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

-- ─── 6.3 EMAIL QUEUE ─────────────────────────────────────────────────────────
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
  client_name         TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 6.4 SCHEDULED REPORTS ───────────────────────────────────────────────────
-- Used by: automated digest and report generation
CREATE TABLE IF NOT EXISTS public.scheduled_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type            TEXT NOT NULL,
  title           TEXT NOT NULL,
  recipients      TEXT[] DEFAULT '{}',
  schedule        TEXT DEFAULT 'weekly',
  last_sent_at    TIMESTAMPTZ,
  next_send_at    TIMESTAMPTZ,
  active          BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 6.5 REPORT LOGS ─────────────────────────────────────────────────────────
-- Used by: delivery tracking for scheduled reports
CREATE TABLE IF NOT EXISTS public.report_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id       UUID REFERENCES public.scheduled_reports(id) ON DELETE CASCADE,
  sent_at         TIMESTAMPTZ DEFAULT NOW(),
  recipient_count INTEGER DEFAULT 0,
  html_body       TEXT,
  error_message   TEXT,
  status          TEXT DEFAULT 'sent'
);

-- ═══════════════════════════════════════════════════════════════════════════════
--  7. CRM INTELLIGENCE — Lead Score Events, Churn Predictions,
--                        Anomalies, Forecasts
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 7.1 LEAD SCORE EVENTS ───────────────────────────────────────────────────
-- Used by: lead scoring history and audit trail
CREATE TABLE IF NOT EXISTS public.lead_score_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  score           INTEGER NOT NULL,
  factors         JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_score_events_client ON public.lead_score_events(client_id);

-- ─── 7.2 CHURN PREDICTIONS ───────────────────────────────────────────────────
-- Used by: churn risk model history
CREATE TABLE IF NOT EXISTS public.churn_predictions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  risk_score      NUMERIC NOT NULL,
  factors         JSONB DEFAULT '{}',
  model_version   TEXT DEFAULT 'v1',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_churn_predictions_client ON public.churn_predictions(client_id);

-- ─── 7.3 ANOMALIES ───────────────────────────────────────────────────────────
-- Used by: anomaly detection engine and CRM alerts
CREATE TABLE IF NOT EXISTS public.anomalies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric          TEXT NOT NULL,
  value           NUMERIC NOT NULL,
  expected_value  NUMERIC NOT NULL,
  deviation       NUMERIC NOT NULL,
  severity        TEXT DEFAULT 'warning',
  detected_at     TIMESTAMPTZ DEFAULT NOW(),
  acknowledged    BOOLEAN DEFAULT FALSE,
  acknowledged_by UUID REFERENCES public.profiles(id),
  metadata        JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_anomalies_metric ON public.anomalies(metric);
CREATE INDEX IF NOT EXISTS idx_anomalies_detected ON public.anomalies(detected_at);

-- ─── 7.4 FORECASTS ───────────────────────────────────────────────────────────
-- Used by: revenue forecasting engine
CREATE TABLE IF NOT EXISTS public.forecasts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period          DATE NOT NULL,
  predicted_mrr   NUMERIC DEFAULT 0,
  predicted_new   NUMERIC DEFAULT 0,
  predicted_churn NUMERIC DEFAULT 0,
  confidence      NUMERIC DEFAULT 0.5,
  model_version   TEXT DEFAULT 'v1',
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_forecasts_period ON public.forecasts(period);

-- ═══════════════════════════════════════════════════════════════════════════════
--  8. NURTURE — Sequences, Steps, Subscriptions
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 8.1 NURTURE SEQUENCES ───────────────────────────────────────────────────
-- Used by: multi-step nurture campaign definitions
CREATE TABLE IF NOT EXISTS public.nurture_sequences (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  description     TEXT,
  active          BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 8.2 NURTURE STEPS ───────────────────────────────────────────────────────
-- Used by: individual nurture campaign steps
CREATE TABLE IF NOT EXISTS public.nurture_steps (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id     UUID REFERENCES public.nurture_sequences(id) ON DELETE CASCADE,
  step_order      INTEGER NOT NULL,
  delay_days      INTEGER NOT NULL DEFAULT 7,
  subject         TEXT,
  template_html   TEXT,
  template_whatsapp TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 8.3 NURTURE SUBSCRIPTIONS ───────────────────────────────────────────────
-- Used by: lead-to-sequence enrollment tracking
CREATE TABLE IF NOT EXISTS public.nurture_subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  sequence_id     UUID REFERENCES public.nurture_sequences(id) ON DELETE CASCADE,
  current_step    INTEGER DEFAULT 0,
  status          TEXT DEFAULT 'active',
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  last_sent_at    TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_nurture_subs_client ON public.nurture_subscriptions(client_id);
CREATE INDEX IF NOT EXISTS idx_nurture_subs_status ON public.nurture_subscriptions(status);

-- ═══════════════════════════════════════════════════════════════════════════════
--  9. KNOWLEDGE BASE — Categories, Articles
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 9.1 KB CATEGORIES ───────────────────────────────────────────────────────
-- Used by: knowledge base article organization
CREATE TABLE IF NOT EXISTS kb_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  icon        TEXT DEFAULT 'file-text',
  parent_id   UUID REFERENCES kb_categories(id) ON DELETE SET NULL,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kb_categories_parent ON kb_categories(parent_id);

-- ─── 9.2 KB ARTICLES ─────────────────────────────────────────────────────────
-- Used by: knowledge base content management
CREATE TABLE IF NOT EXISTS kb_articles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  content     TEXT NOT NULL DEFAULT '',
  type        TEXT NOT NULL CHECK (type IN ('playbook','faq','value_engine_msg','msg_template','email_template','sop','guide','other')),
  category_id UUID REFERENCES kb_categories(id) ON DELETE SET NULL,
  tags        TEXT[] DEFAULT '{}',
  status      TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  author      TEXT,
  version     INT DEFAULT 1,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kb_articles_type ON kb_articles(type);
CREATE INDEX IF NOT EXISTS idx_kb_articles_status ON kb_articles(status);
CREATE INDEX IF NOT EXISTS idx_kb_articles_category ON kb_articles(category_id);

-- ═══════════════════════════════════════════════════════════════════════════════
--  10. CLIENT PORTAL — Auth Tokens, Sessions, Projects,
--                       Milestones, Messages, Documents
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 10.1 PORTAL AUTH TOKENS ─────────────────────────────────────────────────
-- Used by: magic-link authentication flow
CREATE TABLE IF NOT EXISTS portal_auth_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portal_auth_tokens_hash ON portal_auth_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_portal_auth_tokens_client ON portal_auth_tokens(client_id);

-- ─── 10.2 PORTAL SESSIONS ────────────────────────────────────────────────────
-- Used by: authenticated portal sessions (7-day lifetime)
CREATE TABLE IF NOT EXISTS portal_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  last_used_at TIMESTAMPTZ DEFAULT now(),
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portal_sessions_hash ON portal_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_portal_sessions_client ON portal_sessions(client_id);

-- ─── 10.3 PROJECTS ───────────────────────────────────────────────────────────
-- Used by: client portal project listing, CRM projects view
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

-- ─── 10.4 PROJECT MILESTONES ─────────────────────────────────────────────────
-- Used by: client portal milestone tracking, CRM milestone management
CREATE TABLE IF NOT EXISTS project_milestones (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  due_date      DATE,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','cancelled')),
  completed_at  TIMESTAMPTZ,
  sort_order    INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_milestones_project ON project_milestones(project_id);

-- ─── 10.5 PORTAL MESSAGES ────────────────────────────────────────────────────
-- Used by: client <-> team messaging within portal
CREATE TABLE IF NOT EXISTS portal_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  sender      TEXT NOT NULL CHECK (sender IN ('client','team')),
  sender_name TEXT,
  content     TEXT NOT NULL,
  thread_id   UUID REFERENCES portal_messages(id),
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portal_messages_client ON portal_messages(client_id);
CREATE INDEX IF NOT EXISTS idx_portal_messages_thread ON portal_messages(thread_id);

-- ─── 10.6 PORTAL DOCUMENTS ───────────────────────────────────────────────────
-- Used by: document sharing between client and team
CREATE TABLE IF NOT EXISTS portal_documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  uploaded_by TEXT NOT NULL CHECK (uploaded_by IN ('client','team')),
  title       TEXT NOT NULL,
  description TEXT,
  file_url    TEXT NOT NULL,
  file_type   TEXT DEFAULT 'other',
  file_size   INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portal_documents_client ON portal_documents(client_id);

-- ═══════════════════════════════════════════════════════════════════════════════
--  11. TIME TRACKING — Entries, Timers, Reports
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 11.1 TIME ENTRIES ───────────────────────────────────────────────────────
-- Used by: timesheet view, billing reports, project costing
CREATE TABLE IF NOT EXISTS public.time_entries (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  project_id        UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  deal_id           UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  task_id           UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  team_member       TEXT NOT NULL,
  description       TEXT NOT NULL,
  duration_minutes  INT NOT NULL CHECK (duration_minutes > 0),
  date              DATE NOT NULL DEFAULT CURRENT_DATE,
  billable          BOOLEAN DEFAULT true,
  hourly_rate       NUMERIC DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_time_entries_client ON public.time_entries(client_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_project ON public.time_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_member ON public.time_entries(team_member);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON public.time_entries(date);

-- ─── 11.2 TIMERS (Running) ───────────────────────────────────────────────────
-- Used by: live timer start/pause/resume/stop
CREATE TABLE IF NOT EXISTS public.timers (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id             UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  project_id            UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  deal_id               UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  task_id               UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  team_member           TEXT NOT NULL,
  description           TEXT DEFAULT '',
  started_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paused_at             TIMESTAMPTZ,
  total_paused_seconds  INT DEFAULT 0,
  status                TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running','paused','stopped')),
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_timers_member ON public.timers(team_member);
CREATE UNIQUE INDEX IF NOT EXISTS idx_timers_member_active ON public.timers(team_member) WHERE status = 'running';

-- ─── 11.3 TIME REPORTS (Materialized Summary) ─────────────────────────────────
-- Used by: weekly report aggregation, team productivity
CREATE TABLE IF NOT EXISTS public.time_reports (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start          DATE NOT NULL,
  team_member         TEXT NOT NULL,
  total_minutes       INT NOT NULL DEFAULT 0,
  billable_minutes    INT NOT NULL DEFAULT 0,
  project_breakdown   JSONB DEFAULT '{}',
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_time_reports_week_member ON public.time_reports(week_start, team_member);

-- ═══════════════════════════════════════════════════════════════════════════════
--  12. ACCESS & CONFIG — API Keys, Dashboard Widgets, Settings
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 12.1 API KEYS ───────────────────────────────────────────────────────────
-- Used by: public API access, integration authentication
CREATE TABLE IF NOT EXISTS public.api_keys (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  key_hash        TEXT UNIQUE NOT NULL,
  key_prefix      TEXT NOT NULL,
  permissions     TEXT[] DEFAULT '{}',
  rate_limit      INTEGER DEFAULT 100,
  profile_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_used_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  active          BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON public.api_keys(key_prefix);

-- ─── 12.2 DASHBOARD WIDGETS ──────────────────────────────────────────────────
-- Used by: per-user dashboard layout configuration
CREATE TABLE IF NOT EXISTS public.dashboard_widgets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  widget_type     TEXT NOT NULL,
  config          JSONB DEFAULT '{}',
  position        INTEGER DEFAULT 0,
  visible         BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 12.3 SETTINGS ───────────────────────────────────────────────────────────
-- Used by: ops dashboard, resend.js, email queue processor
CREATE TABLE IF NOT EXISTS public.settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL DEFAULT '',
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════════
--  13. SCHEMA ENHANCEMENTS — ALTER TABLE additions
-- ═══════════════════════════════════════════════════════════════════════════════

-- Backfill logged_at from created_at for existing deals
UPDATE public.deals SET logged_at = created_at WHERE logged_at IS NULL;

-- Enhanced full-text search index for knowledge base articles
CREATE INDEX IF NOT EXISTS idx_kb_articles_search
  ON kb_articles
  USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, '')));

-- ═══════════════════════════════════════════════════════════════════════════════
--  14. REALTIME PUBLICATIONS
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

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.forecasts;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.anomalies;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.nurture_subscriptions;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
--  15. ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── Portal Tables ───────────────────────────────────────────────────────────
ALTER TABLE portal_auth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can manage auth tokens"
  ON portal_auth_tokens FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can manage sessions"
  ON portal_sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can manage projects"
  ON projects FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can manage milestones"
  ON project_milestones FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can manage messages"
  ON portal_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can manage documents"
  ON portal_documents FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─── Knowledge Base Tables ───────────────────────────────────────────────────
ALTER TABLE kb_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published articles"
  ON kb_articles FOR SELECT USING (status = 'published');
CREATE POLICY "Auth users can read all articles"
  ON kb_articles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert articles"
  ON kb_articles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update articles"
  ON kb_articles FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete articles"
  ON kb_articles FOR DELETE TO authenticated USING (true);
CREATE POLICY "Auth users can read categories"
  ON kb_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert categories"
  ON kb_categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update categories"
  ON kb_categories FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete categories"
  ON kb_categories FOR DELETE TO authenticated USING (true);

-- ─── Time Tracking Tables ────────────────────────────────────────────────────
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can manage time entries"
  ON public.time_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can manage timers"
  ON public.timers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can manage time reports"
  ON public.time_reports FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════════
--  16. SEED DATA
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── Default Admin Profile ───────────────────────────────────────────────────
INSERT INTO public.profiles (id, username, full_name, email)
VALUES ('00000000-0000-0000-0000-000000000001', 'admin', 'CRM Admin', 'admin@flodon.in')
ON CONFLICT (id) DO NOTHING;

-- ─── Settings ────────────────────────────────────────────────────────────────
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

-- ─── Knowledge Base: Default Categories ──────────────────────────────────────
INSERT INTO kb_categories (name, slug, description, icon, sort_order) VALUES
  ('Sales Playbooks',    'sales-playbooks',    'Step-by-step sales playbooks and methodologies',                'target',      1),
  ('FAQs',               'faqs',               'Frequently asked questions — internal and customer-facing',    'help-circle', 2),
  ('Value Engine',       'value-engine',       'Value propositions, messaging frameworks, and positioning',    'zap',         3),
  ('Message Templates',  'msg-templates',      'Pre-written messages for calls, emails, LinkedIn, and SMS',    'message-square', 4),
  ('Email Templates',    'email-templates',    'Transactional and marketing email templates',                  'mail',        5),
  ('SOPs',               'sops',               'Standard Operating Procedures for all departments',            'clipboard',   6),
  ('Guides',             'guides',             'How-to guides, onboarding docs, and best practices',           'book-open',   7)
ON CONFLICT (slug) DO NOTHING;

COMMIT;
