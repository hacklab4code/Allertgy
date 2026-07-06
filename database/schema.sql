-- ============================================================
-- AllerTgy — Schema MySQL (Hostinger: u490938806_allerYgy)
-- MySQL 8.x / MariaDB 10.6+, charset utf8mb4
-- ============================================================

SET NAMES utf8mb4;

-- ---------- UTENTI ----------
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,           -- bcrypt
  display_name  VARCHAR(100),
  disclaimer_accepted_at DATETIME NULL,          -- pop-up legale obbligatorio
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- ALLERGENI (14 UE + preferenze alimentari) ----------
CREATE TABLE IF NOT EXISTS allergens (
  id         TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code       VARCHAR(30) NOT NULL UNIQUE,        -- slug stabile per il client
  name_it    VARCHAR(100) NOT NULL,
  emoji      VARCHAR(8),
  is_diet    TINYINT(1) NOT NULL DEFAULT 0,      -- 1 = preferenza (vegano…)
  sort_order TINYINT UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- PROFILO ALLERGENICO UTENTE ----------
CREATE TABLE IF NOT EXISTS user_allergens (
  user_id     INT UNSIGNED NOT NULL,
  allergen_id TINYINT UNSIGNED NOT NULL,
  PRIMARY KEY (user_id, allergen_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (allergen_id) REFERENCES allergens(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- RISTORANTI ----------
CREATE TABLE IF NOT EXISTS restaurants (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  public_code CHAR(6) NOT NULL UNIQUE,           -- "Codice Locale" (anche nel QR)
  name        VARCHAR(150) NOT NULL,
  city        VARCHAR(100),
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- PIATTI ----------
CREATE TABLE IF NOT EXISTS dishes (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  restaurant_id INT UNSIGNED NOT NULL,
  name          VARCHAR(150) NOT NULL,
  description   TEXT,
  category      VARCHAR(60),                     -- Antipasti, Primi…
  price_cents   INT UNSIGNED,
  is_available  TINYINT(1) NOT NULL DEFAULT 1,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
  INDEX idx_dishes_restaurant (restaurant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- ALLERGENI PER PIATTO (contenuti / tracce) ----------
CREATE TABLE IF NOT EXISTS dish_allergens (
  dish_id     INT UNSIGNED NOT NULL,
  allergen_id TINYINT UNSIGNED NOT NULL,
  kind        ENUM('contains','traces') NOT NULL,
  PRIMARY KEY (dish_id, allergen_id, kind),
  FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE CASCADE,
  FOREIGN KEY (allergen_id) REFERENCES allergens(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- SEED: 14 allergeni Reg. UE 1169/2011 + preferenze
-- ============================================================
INSERT IGNORE INTO allergens (code, name_it, emoji, is_diet, sort_order) VALUES
('glutine',        'Cereali contenenti glutine', '🌾', 0, 1),
('crostacei',      'Crostacei',                  '🦐', 0, 2),
('uova',           'Uova',                       '🥚', 0, 3),
('pesce',          'Pesce',                      '🐟', 0, 4),
('arachidi',       'Arachidi',                   '🥜', 0, 5),
('soia',           'Soia',                       '🌱', 0, 6),
('latte',          'Latte e lattosio',           '🥛', 0, 7),
('frutta_a_guscio','Frutta a guscio',            '🌰', 0, 8),
('sedano',         'Sedano',                     '🥬', 0, 9),
('senape',         'Senape',                     '🟡', 0, 10),
('sesamo',         'Semi di sesamo',             '⚪', 0, 11),
('solfiti',        'Anidride solforosa e solfiti','🍷', 0, 12),
('lupini',         'Lupini',                     '🫘', 0, 13),
('molluschi',      'Molluschi',                  '🦑', 0, 14),
('vegano',         'Vegano',                     '🌿', 1, 15),
('vegetariano',    'Vegetariano',                '🥗', 1, 16);
