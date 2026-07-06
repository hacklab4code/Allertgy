-- ============================================================
-- AllerTgy — Migrazione v2 (supporto dashboard B2B)
-- Eseguire DOPO schema.sql
-- ============================================================

ALTER TABLE users
  ADD COLUMN role ENUM('customer','owner') NOT NULL DEFAULT 'customer';

ALTER TABLE restaurants
  ADD COLUMN owner_user_id INT UNSIGNED NULL,
  ADD COLUMN menu_updated_at DATETIME NULL,
  ADD CONSTRAINT fk_restaurants_owner
    FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE SET NULL;
