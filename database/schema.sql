-- ============================================================
-- Nexus CRM — PostgreSQL Schema
-- Run: psql -U postgres -d nexus_crm -f schema.sql
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Users (sales reps + admins) ────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(120)  NOT NULL,
  email         VARCHAR(255)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  role          VARCHAR(20)   NOT NULL DEFAULT 'rep' CHECK (role IN ('admin', 'rep')),
  avatar_color  VARCHAR(30)   NOT NULL DEFAULT 'accent',
  last_login    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── Leads ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(150)    NOT NULL,
  email       VARCHAR(255),
  phone       VARCHAR(30),
  company     VARCHAR(150),
  status      VARCHAR(20)     NOT NULL DEFAULT 'new'
                              CHECK (status IN ('new','contacted','qualified','lost')),
  priority    VARCHAR(10)     NOT NULL DEFAULT 'medium'
                              CHECK (priority IN ('high','medium','low')),
  source      VARCHAR(50)     NOT NULL DEFAULT 'Website',
  value       NUMERIC(12, 2)  NOT NULL DEFAULT 0,
  notes       TEXT,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS leads_status_idx      ON leads(status);
CREATE INDEX IF NOT EXISTS leads_assigned_to_idx ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS leads_created_at_idx  ON leads(created_at DESC);

-- ── Customers ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(150)   NOT NULL,
  email           VARCHAR(255),
  phone           VARCHAR(30),
  company         VARCHAR(150),
  industry        VARCHAR(80)    NOT NULL DEFAULT 'Technology',
  lifetime_value  NUMERIC(14, 2) NOT NULL DEFAULT 0,
  account_manager UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS customers_company_idx ON customers(company);

-- ── Customer interaction history ───────────────────────────
CREATE TABLE IF NOT EXISTS interactions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  type        VARCHAR(100) NOT NULL,   -- e.g. "Email sent", "Call completed"
  notes       TEXT,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS interactions_customer_idx ON interactions(customer_id);

-- ── Deals ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS deals (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(200)   NOT NULL,
  company     VARCHAR(150),
  value       NUMERIC(12, 2) NOT NULL DEFAULT 0,
  stage       VARCHAR(20)    NOT NULL DEFAULT 'prospect'
                             CHECK (stage IN ('prospect','qualified','negotiation','closed')),
  probability SMALLINT       NOT NULL DEFAULT 20
                             CHECK (probability BETWEEN 0 AND 100),
  close_date  DATE,
  notes       TEXT,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS deals_stage_idx       ON deals(stage);
CREATE INDEX IF NOT EXISTS deals_assigned_to_idx ON deals(assigned_to);
CREATE INDEX IF NOT EXISTS deals_close_date_idx  ON deals(close_date);

-- ── Tasks ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       VARCHAR(250)  NOT NULL,
  done        BOOLEAN       NOT NULL DEFAULT FALSE,
  priority    VARCHAR(10)   NOT NULL DEFAULT 'Medium'
                            CHECK (priority IN ('High', 'Medium', 'Low')),
  due_date    DATE,
  link_type   VARCHAR(20),   -- 'lead' | 'customer' | 'deal'
  link_id     UUID,          -- ID of the linked entity
  notes       TEXT,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tasks_assigned_to_idx ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS tasks_done_idx        ON tasks(done);
CREATE INDEX IF NOT EXISTS tasks_due_date_idx    ON tasks(due_date);

-- ── Auto-update updated_at trigger ────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_users_updated_at    BEFORE UPDATE ON users    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  CREATE TRIGGER trg_leads_updated_at    BEFORE UPDATE ON leads    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  CREATE TRIGGER trg_deals_updated_at    BEFORE UPDATE ON deals    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  CREATE TRIGGER trg_tasks_updated_at    BEFORE UPDATE ON tasks    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
