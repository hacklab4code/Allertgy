-- ============================================================
-- AllerTgy — Migrazione v5 (piano di lancio)
-- Recupero password, foto, pagina pubblica, documenti medici + AI,
-- recensioni, notifiche, Stripe.
-- Eseguire DOPO schema.sql ... schema_v4.sql se non usi le
-- migrazioni automatiche del backend (che replicano tutto questo).
-- Nota: gli orari restano nel campo esistente restaurants.opening_hours.
-- ============================================================

-- Recupero password
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id      INT UNSIGNED NOT NULL,
  token_hash   VARCHAR(255) NOT NULL,
  expires_at   DATETIME NOT NULL,
  used_at      DATETIME NULL,
  requested_ip VARCHAR(45),
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_prt_token_hash (token_hash),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Foto profilo utente (chiave sullo storage privato)
ALTER TABLE users ADD COLUMN photo_key VARCHAR(255) NULL;

-- Galleria foto ristorante (limiti per piano applicati dall'API)
CREATE TABLE IF NOT EXISTS restaurant_photos (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  restaurant_id INT UNSIGNED NOT NULL,
  storage_key   VARCHAR(255) NOT NULL,
  is_cover      TINYINT(1) NOT NULL DEFAULT 0,
  sort_order    TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Pagina pubblica ristorante
ALTER TABLE restaurants
  ADD COLUMN slug VARCHAR(160) NULL UNIQUE,
  ADD COLUMN website VARCHAR(255) NULL,
  ADD COLUMN description TEXT NULL;

-- Documenti medici + estrazione AI (mai scrittura automatica sul profilo)
CREATE TABLE IF NOT EXISTS medical_documents (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       INT UNSIGNED NOT NULL,
  storage_key   VARCHAR(255) NOT NULL,
  filename      VARCHAR(255) NOT NULL,
  mime_type     VARCHAR(100) NOT NULL,
  status        ENUM('pending','processed','failed') NOT NULL DEFAULT 'pending',
  ai_consent_at DATETIME NULL,  -- consenso specifico per l'analisi AI di QUESTO documento
  uploaded_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS allergen_extractions (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  document_id   INT UNSIGNED NOT NULL,
  allergen_code VARCHAR(30) NOT NULL,
  confidence    DECIMAL(3,2),
  applied       TINYINT(1) NOT NULL DEFAULT 0,  -- 1 solo dopo conferma esplicita utente
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES medical_documents(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Audit: chi ha visto un documento medico e quando
CREATE TABLE IF NOT EXISTS document_access_log (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  document_id INT UNSIGNED NOT NULL,
  accessed_by INT UNSIGNED NOT NULL,
  accessed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES medical_documents(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE user_allergens
  ADD COLUMN source ENUM('manual','document_ai') NOT NULL DEFAULT 'manual',
  ADD COLUMN confirmed_at DATETIME NULL;

-- Recensioni (una per utente per ristorante)
CREATE TABLE IF NOT EXISTS reviews (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  restaurant_id INT UNSIGNED NOT NULL,
  user_id       INT UNSIGNED NOT NULL,
  rating        TINYINT UNSIGNED NOT NULL,  -- 1..5
  comment       TEXT,
  is_hidden     TINYINT(1) NOT NULL DEFAULT 0,
  hidden_reason VARCHAR(255) NULL,
  reported_count INT UNSIGNED NOT NULL DEFAULT 0,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_review_user_restaurant (restaurant_id, user_id),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS review_replies (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  review_id  INT UNSIGNED NOT NULL UNIQUE,
  reply      TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Preferiti lato server (per notifiche "menù aggiornato" e pagina pubblica)
CREATE TABLE IF NOT EXISTS user_favorites (
  user_id       INT UNSIGNED NOT NULL,
  restaurant_id INT UNSIGNED NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, restaurant_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Notifiche
CREATE TABLE IF NOT EXISTS device_tokens (
  user_id    INT UNSIGNED NOT NULL,
  expo_token VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, expo_token),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS notifications (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id      INT UNSIGNED NOT NULL,
  type         VARCHAR(50) NOT NULL,
  payload_json JSON,
  read_at      DATETIME NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Pagamenti reali (Stripe)
ALTER TABLE restaurants
  ADD COLUMN stripe_customer_id VARCHAR(100) NULL,
  ADD COLUMN stripe_subscription_id VARCHAR(100) NULL,
  ADD COLUMN stripe_price_id VARCHAR(100) NULL;

CREATE TABLE IF NOT EXISTS invoices (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  restaurant_id     INT UNSIGNED NOT NULL,
  stripe_invoice_id VARCHAR(100) NOT NULL UNIQUE,
  amount_cents      INT NOT NULL,
  status            VARCHAR(30) NOT NULL,
  pdf_url           VARCHAR(500),
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
