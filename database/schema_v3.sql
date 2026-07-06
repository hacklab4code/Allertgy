-- ============================================================
-- AllerTgy — Migrazione v3 (consensi legali e conferma menu)
-- Eseguire DOPO schema.sql e schema_v2.sql se non usi le migrazioni automatiche.
-- ============================================================

ALTER TABLE users
  ADD COLUMN terms_accepted_at DATETIME NULL,
  ADD COLUMN privacy_accepted_at DATETIME NULL,
  ADD COLUMN health_data_consent_at DATETIME NULL,
  ADD COLUMN legal_terms_version VARCHAR(40) NULL,
  ADD COLUMN privacy_version VARCHAR(40) NULL,
  ADD COLUMN safety_disclaimer_version VARCHAR(40) NULL,
  ADD COLUMN onboarding_completed_at DATETIME NULL;

ALTER TABLE restaurants
  ADD COLUMN menu_legal_confirmed_at DATETIME NULL,
  ADD COLUMN menu_legal_confirmed_by INT UNSIGNED NULL,
  ADD COLUMN menu_legal_version VARCHAR(40) NULL;
