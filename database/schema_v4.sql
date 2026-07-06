-- ============================================================
-- AllerTgy — Migrazione v4 (piani commerciali e admin interno)
-- Eseguire DOPO schema.sql, schema_v2.sql e schema_v3.sql se non usi
-- le migrazioni automatiche del backend.
-- ============================================================

ALTER TABLE restaurants
  ADD COLUMN business_plan VARCHAR(30) NOT NULL DEFAULT 'free',
  ADD COLUMN subscription_status VARCHAR(30) NOT NULL DEFAULT 'free',
  ADD COLUMN plan_price_cents INT NOT NULL DEFAULT 0,
  ADD COLUMN is_verified TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN featured_priority INT NOT NULL DEFAULT 0,
  ADD COLUMN plan_started_at DATETIME NULL,
  ADD COLUMN trial_ends_at DATETIME NULL,
  ADD COLUMN billing_email VARCHAR(255) NULL,
  ADD COLUMN vat_number VARCHAR(50) NULL,
  ADD COLUMN sdi_code VARCHAR(20) NULL,
  ADD COLUMN pec_email VARCHAR(255) NULL,
  ADD COLUMN commercial_notes VARCHAR(1000) NULL;
