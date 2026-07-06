-- ============================================================
-- AllerTgy — Dati demo per i test (Trattoria Da Matteo, codice 100001)
-- Eseguire DOPO schema.sql
-- ============================================================

INSERT INTO restaurants (public_code, name, city) VALUES
('100001', 'Trattoria Da Matteo', 'Milano');

SET @r = LAST_INSERT_ID();

INSERT INTO dishes (restaurant_id, name, description, category, price_cents) VALUES
(@r, 'Spaghetti alla carbonara', 'Guanciale, uova, pecorino', 'Primi', 1200),
(@r, 'Risotto alla milanese',    'Zafferano, burro, parmigiano', 'Primi', 1300),
(@r, 'Insalata di mare',         'Polpo, gamberi, sedano', 'Antipasti', 1400),
(@r, 'Grigliata di verdure',     'Verdure di stagione, olio EVO', 'Contorni', 700),
(@r, 'Tiramisù',                 'Mascarpone, savoiardi, caffè', 'Dolci', 600);

-- Allergeni (kind: contains = contenuti, traces = tracce)
INSERT INTO dish_allergens (dish_id, allergen_id, kind)
SELECT d.id, a.id, x.kind FROM (
  SELECT 'Spaghetti alla carbonara' dish, 'glutine' code, 'contains' kind UNION ALL
  SELECT 'Spaghetti alla carbonara', 'uova',      'contains' UNION ALL
  SELECT 'Spaghetti alla carbonara', 'latte',     'contains' UNION ALL
  SELECT 'Risotto alla milanese',    'latte',     'contains' UNION ALL
  SELECT 'Risotto alla milanese',    'sedano',    'traces'   UNION ALL
  SELECT 'Insalata di mare',         'molluschi', 'contains' UNION ALL
  SELECT 'Insalata di mare',         'crostacei', 'contains' UNION ALL
  SELECT 'Insalata di mare',         'sedano',    'contains' UNION ALL
  SELECT 'Insalata di mare',         'pesce',     'traces'   UNION ALL
  SELECT 'Grigliata di verdure',     'solfiti',   'traces'   UNION ALL
  SELECT 'Tiramisù',                 'glutine',   'contains' UNION ALL
  SELECT 'Tiramisù',                 'uova',      'contains' UNION ALL
  SELECT 'Tiramisù',                 'latte',     'contains' UNION ALL
  SELECT 'Tiramisù',                 'frutta_a_guscio', 'traces'
) x
JOIN dishes d ON d.name = x.dish AND d.restaurant_id = @r
JOIN allergens a ON a.code = x.code;
