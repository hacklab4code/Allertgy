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

-- ---------- ALLERGENI (UE + estesi + preferenze alimentari) ----------
CREATE TABLE IF NOT EXISTS allergens (
  id         TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code       VARCHAR(30) NOT NULL UNIQUE,        -- slug stabile per il client
  name_it    VARCHAR(100) NOT NULL,
  emoji      VARCHAR(8),
  is_diet    TINYINT(1) NOT NULL DEFAULT 0,      -- 1 = preferenza (vegano…)
  sort_order TINYINT UNSIGNED NOT NULL DEFAULT 0,
  category   VARCHAR(30) NOT NULL DEFAULT 'ue'   -- sezione UI (ue, frutta, verdura…)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- PROFILO ALLERGENICO UTENTE ----------
CREATE TABLE IF NOT EXISTS user_allergens (
  user_id     INT UNSIGNED NOT NULL,
  allergen_id TINYINT UNSIGNED NOT NULL,
  intensity   ENUM('lieve', 'moderata', 'grave') NOT NULL DEFAULT 'moderata',
  criterio    ENUM('assoluto', 'crudo', 'cotto') NOT NULL DEFAULT 'assoluto',
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
-- SEED: allergeni UE + estesi + preferenze (vedi backend/app/allergens_seed.py)
-- ============================================================
INSERT IGNORE INTO allergens (code, name_it, emoji, is_diet, sort_order, category) VALUES
('glutine', 'Cereali contenenti glutine', '🌾', 0, 1, 'ue'),
('crostacei', 'Crostacei', '🦐', 0, 2, 'ue'),
('uova', 'Uova', '🥚', 0, 3, 'ue'),
('pesce', 'Pesce', '🐟', 0, 4, 'ue'),
('arachidi', 'Arachidi', '🥜', 0, 5, 'ue'),
('soia', 'Soia', '🌱', 0, 6, 'ue'),
('latte', 'Latte e lattosio', '🥛', 0, 7, 'ue'),
('frutta_a_guscio', 'Frutta a guscio', '🌰', 0, 8, 'ue'),
('sedano', 'Sedano', '🥬', 0, 9, 'ue'),
('senape', 'Senape', '🟡', 0, 10, 'ue'),
('sesamo', 'Semi di sesamo', '⚪', 0, 11, 'ue'),
('solfiti', 'Anidride solforosa e solfiti', '🍷', 0, 12, 'ue'),
('lupini', 'Lupini', '🫘', 0, 13, 'ue'),
('molluschi', 'Molluschi', '🦑', 0, 14, 'ue'),
('mandorle', 'Mandorle', '🌰', 0, 20, 'frutta_guscio'),
('nocciole', 'Nocciole', '🌰', 0, 21, 'frutta_guscio'),
('noci', 'Noci', '🌰', 0, 22, 'frutta_guscio'),
('noci_pecan', 'Noci pecan', '🌰', 0, 23, 'frutta_guscio'),
('noci_brasiliane', 'Noci brasiliane', '🌰', 0, 24, 'frutta_guscio'),
('pistacchi', 'Pistacchi', '🌰', 0, 25, 'frutta_guscio'),
('anacardi', 'Anacardi', '🌰', 0, 26, 'frutta_guscio'),
('castagne', 'Castagne', '🌰', 0, 27, 'frutta_guscio'),
('pinoli', 'Pinoli', '🌰', 0, 28, 'frutta_guscio'),
('macadamia', 'Noci macadamia', '🌰', 0, 29, 'frutta_guscio'),
('fragole', 'Fragole', '🍓', 0, 30, 'frutta'),
('kiwi', 'Kiwi', '🥝', 0, 31, 'frutta'),
('mela', 'Mela', '🍎', 0, 32, 'frutta'),
('pesca', 'Pesca', '🍑', 0, 33, 'frutta'),
('arancia', 'Arancia', '🍊', 0, 34, 'frutta'),
('limone', 'Limone', '🍋', 0, 35, 'frutta'),
('agrumi', 'Agrumi', '🍊', 0, 36, 'frutta'),
('banana', 'Banana', '🍌', 0, 37, 'frutta'),
('uva', 'Uva', '🍇', 0, 38, 'frutta'),
('anguria', 'Anguria', '🍉', 0, 39, 'frutta'),
('melone', 'Melone', '🍈', 0, 40, 'frutta'),
('ananas', 'Ananas', '🍍', 0, 41, 'frutta'),
('mango', 'Mango', '🥭', 0, 42, 'frutta'),
('avocado', 'Avocado', '🥑', 0, 43, 'frutta'),
('albicocca', 'Albicocca', '🍑', 0, 44, 'frutta'),
('ciliegia', 'Ciliegia', '🍒', 0, 45, 'frutta'),
('pera', 'Pera', '🍐', 0, 46, 'frutta'),
('prugna', 'Prugna', '🫐', 0, 47, 'frutta'),
('lamponi', 'Lamponi', '🫐', 0, 48, 'frutta'),
('mirtilli', 'Mirtilli', '🫐', 0, 49, 'frutta'),
('cocco', 'Cocco', '🥥', 0, 50, 'frutta'),
('frutti_di_bosco', 'Frutti di bosco', '🫐', 0, 51, 'frutta'),
('pomodoro', 'Pomodoro', '🍅', 0, 60, 'verdura'),
('aglio', 'Aglio', '🧄', 0, 61, 'verdura'),
('cipolla', 'Cipolla', '🧅', 0, 62, 'verdura'),
('carota', 'Carota', '🥕', 0, 63, 'verdura'),
('funghi', 'Funghi', '🍄', 0, 64, 'verdura'),
('mais', 'Mais', '🌽', 0, 65, 'verdura'),
('peperoncino', 'Peperoncino', '🌶️', 0, 66, 'verdura'),
('peperone', 'Peperone', '🫑', 0, 67, 'verdura'),
('melanzana', 'Melanzana', '🍆', 0, 68, 'verdura'),
('zucchina', 'Zucchina', '🥒', 0, 69, 'verdura'),
('spinaci', 'Spinaci', '🥬', 0, 70, 'verdura'),
('broccoli', 'Broccoli', '🥦', 0, 71, 'verdura'),
('cavolfiore', 'Cavolfiore', '🥦', 0, 72, 'verdura'),
('cavolo', 'Cavolo', '🥬', 0, 73, 'verdura'),
('patata', 'Patata', '🥔', 0, 74, 'verdura'),
('piselli', 'Piselli', '🫛', 0, 75, 'verdura'),
('fagioli', 'Fagioli', '🫘', 0, 76, 'verdura'),
('lenticchie', 'Lenticchie', '🫘', 0, 77, 'verdura'),
('cetriolo', 'Cetriolo', '🥒', 0, 78, 'verdura'),
('lattuga', 'Lattuga e insalata', '🥬', 0, 79, 'verdura'),
('rucola', 'Rucola', '🥬', 0, 80, 'verdura'),
('barbabietola', 'Barbabietola', '🫚', 0, 81, 'verdura'),
('finocchio', 'Finocchio', '🌿', 0, 82, 'verdura'),
('asparagi', 'Asparagi', '🌿', 0, 83, 'verdura'),
('carciofi', 'Carciofi', '🌿', 0, 84, 'verdura'),
('porri', 'Porri', '🧅', 0, 85, 'verdura'),
('riso', 'Riso', '🍚', 0, 90, 'cereali'),
('avena', 'Avena', '🌾', 0, 91, 'cereali'),
('segale', 'Segale', '🌾', 0, 92, 'cereali'),
('orzo', 'Orzo', '🌾', 0, 93, 'cereali'),
('quinoa', 'Quinoa', '🌾', 0, 94, 'cereali'),
('farro', 'Farro', '🌾', 0, 95, 'cereali'),
('grano_saraceno', 'Grano saraceno', '🌾', 0, 96, 'cereali'),
('teff', 'Teff', '🌾', 0, 97, 'cereali'),
('amaranto', 'Amaranto', '🌾', 0, 98, 'cereali'),
('cannella', 'Cannella', '🟤', 0, 100, 'spezie'),
('vaniglia', 'Vaniglia', '🌼', 0, 101, 'spezie'),
('pepe', 'Pepe', '⚫', 0, 102, 'spezie'),
('curry', 'Curry', '🟡', 0, 103, 'spezie'),
('zenzero', 'Zenzero', '🫚', 0, 104, 'spezie'),
('noce_moscata', 'Noce moscata', '🟤', 0, 105, 'spezie'),
('chiodi_di_garofano', 'Chiodi di garofano', '🌿', 0, 106, 'spezie'),
('paprika', 'Paprika', '🌶️', 0, 107, 'spezie'),
('cumino', 'Cumino', '🟤', 0, 108, 'spezie'),
('origano', 'Origano', '🌿', 0, 109, 'spezie'),
('rosmarino', 'Rosmarino', '🌿', 0, 110, 'spezie'),
('timo', 'Timo', '🌿', 0, 111, 'spezie'),
('salvia', 'Salvia', '🌿', 0, 112, 'spezie'),
('anice', 'Anice', '🌿', 0, 113, 'spezie'),
('curcuma', 'Curcuma', '🟡', 0, 114, 'spezie'),
('coriandolo', 'Coriandolo', '🌿', 0, 115, 'spezie'),
('alloro', 'Alloro', '🌿', 0, 116, 'spezie'),
('istamina', 'Istamina', '🧪', 0, 120, 'intolleranze'),
('fruttosio', 'Fruttosio', '🍬', 0, 121, 'intolleranze'),
('sorbitolo', 'Sorbitolo', '🍬', 0, 122, 'intolleranze'),
('caffeina', 'Caffeina', '☕', 0, 123, 'intolleranze'),
('alcool', 'Alcool', '🍷', 0, 124, 'intolleranze'),
('nichel', 'Nichel', '⚙️', 0, 125, 'intolleranze'),
('solanacee', 'Solanacee', '🍆', 0, 126, 'intolleranze'),
('caseina', 'Caseina', '🥛', 0, 127, 'intolleranze'),
('glutammato', 'Glutammato', '🧂', 0, 128, 'intolleranze'),
('fosfati', 'Fosfati alimentari', '🧪', 0, 129, 'intolleranze'),
('nitriti', 'Nitriti / nitriti', '🧪', 0, 130, 'intolleranze'),
('vegano', 'Vegano', '🌿', 1, 140, 'preferenze'),
('vegetariano', 'Vegetariano', '🥗', 1, 141, 'preferenze'),
('halal', 'Halal', '☪️', 1, 142, 'preferenze'),
('kosher', 'Kosher', '✡️', 1, 143, 'preferenze'),
('senza_glutine', 'Senza glutine', '🌾', 1, 144, 'preferenze'),
('senza_lattosio', 'Senza lattosio', '🥛', 1, 145, 'preferenze'),
('pescetariano', 'Pescetariano', '🐟', 1, 146, 'preferenze');
