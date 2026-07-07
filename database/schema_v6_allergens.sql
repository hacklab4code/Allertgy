-- ============================================================
-- AllerTgy — Aggiornamento DB: u490938806_allerYgy
-- Aggiorna la tabella allergens:
--   1. Aggiunge colonna `category`
--   2. Aggiorna i 16 record esistenti con la categoria corretta
--   3. Inserisce i nuovi 175 allergeni (id 17→191)
--   4. Aggiorna AUTO_INCREMENT
-- Sicuro da eseguire anche se il DB è già parzialmente aggiornato.
-- ============================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";
/*!40101 SET NAMES utf8mb4 */;

-- ============================================================
-- STEP 1: Aggiungi colonna `category` se non esiste già
-- ============================================================
ALTER TABLE `allergens`
  ADD COLUMN IF NOT EXISTS `category` VARCHAR(30) NOT NULL DEFAULT 'ue';

-- ============================================================
-- STEP 2: Aggiorna i 16 allergeni esistenti
--         (category, sort_order e name_it corretti)
-- ============================================================
UPDATE `allergens` SET `category`='ue', `sort_order`=1,  `name_it`='Cereali contenenti glutine'    WHERE `code`='glutine';
UPDATE `allergens` SET `category`='ue', `sort_order`=2,  `name_it`='Crostacei'                     WHERE `code`='crostacei';
UPDATE `allergens` SET `category`='ue', `sort_order`=3,  `name_it`='Uova'                          WHERE `code`='uova';
UPDATE `allergens` SET `category`='ue', `sort_order`=4,  `name_it`='Pesce'                         WHERE `code`='pesce';
UPDATE `allergens` SET `category`='ue', `sort_order`=5,  `name_it`='Arachidi'                      WHERE `code`='arachidi';
UPDATE `allergens` SET `category`='ue', `sort_order`=6,  `name_it`='Soia'                          WHERE `code`='soia';
UPDATE `allergens` SET `category`='ue', `sort_order`=7,  `name_it`='Latte e lattosio'              WHERE `code`='latte';
UPDATE `allergens` SET `category`='ue', `sort_order`=8,  `name_it`='Frutta a guscio'               WHERE `code`='frutta_a_guscio';
UPDATE `allergens` SET `category`='ue', `sort_order`=9,  `name_it`='Sedano'                        WHERE `code`='sedano';
UPDATE `allergens` SET `category`='ue', `sort_order`=10, `name_it`='Senape'                        WHERE `code`='senape';
UPDATE `allergens` SET `category`='ue', `sort_order`=11, `name_it`='Semi di sesamo'                WHERE `code`='sesamo';
UPDATE `allergens` SET `category`='ue', `sort_order`=12, `name_it`='Anidride solforosa e solfiti'  WHERE `code`='solfiti';
UPDATE `allergens` SET `category`='ue', `sort_order`=13, `name_it`='Lupini'                        WHERE `code`='lupini';
UPDATE `allergens` SET `category`='ue', `sort_order`=14, `name_it`='Molluschi'                     WHERE `code`='molluschi';
UPDATE `allergens` SET `category`='preferenze', `sort_order`=150, `name_it`='Vegano'               WHERE `code`='vegano';
UPDATE `allergens` SET `category`='preferenze', `sort_order`=151, `name_it`='Vegetariano'          WHERE `code`='vegetariano';

-- ============================================================
-- STEP 3: Inserisci tutti i nuovi allergeni
--         (INSERT IGNORE evita errori se già presenti)
-- ============================================================
INSERT IGNORE INTO `allergens` (`code`, `name_it`, `emoji`, `is_diet`, `sort_order`, `category`) VALUES

-- --- Pesce (dettaglio) ---
('tonno',                'Tonno',                              '🐟', 0, 15,  'pesce_dettaglio'),
('salmone',              'Salmone',                            '🐟', 0, 16,  'pesce_dettaglio'),
('merluzzo',             'Merluzzo',                           '🐟', 0, 17,  'pesce_dettaglio'),
('acciughe',             'Acciughe / Alici',                   '🐟', 0, 18,  'pesce_dettaglio'),
('sgombro',              'Sgombro',                            '🐟', 0, 19,  'pesce_dettaglio'),
('trota',                'Trota',                              '🐟', 0, 20,  'pesce_dettaglio'),
('branzino',             'Branzino / Spigola',                 '🐟', 0, 21,  'pesce_dettaglio'),
('orata',                'Orata',                              '🐟', 0, 22,  'pesce_dettaglio'),
('sardine',              'Sardine',                            '🐟', 0, 23,  'pesce_dettaglio'),
('aringa',               'Aringa',                             '🐟', 0, 24,  'pesce_dettaglio'),
('cernia',               'Cernia',                             '🐟', 0, 25,  'pesce_dettaglio'),
('rombo',                'Rombo',                              '🐟', 0, 26,  'pesce_dettaglio'),
('baccala',              'Baccalà / Stoccafisso',              '🐟', 0, 27,  'pesce_dettaglio'),
('calamari',             'Calamari',                           '🦑', 0, 28,  'pesce_dettaglio'),
('polpo',                'Polpo',                              '🐙', 0, 29,  'pesce_dettaglio'),
('seppia',               'Seppia',                             '🦑', 0, 30,  'pesce_dettaglio'),
('gamberi',              'Gamberi',                            '🦐', 0, 31,  'pesce_dettaglio'),
('astice',               'Astice / Aragosta',                  '🦞', 0, 32,  'pesce_dettaglio'),
('vongole',              'Vongole',                            '🦪', 0, 33,  'pesce_dettaglio'),
('cozze',                'Cozze',                              '🦪', 0, 34,  'pesce_dettaglio'),
('ostriche',             'Ostriche',                           '🦪', 0, 35,  'pesce_dettaglio'),

-- --- Carne e salumi ---
('maiale',               'Maiale / Suino',                     '🐷', 0, 36,  'carne'),
('manzo',                'Manzo / Bovino',                     '🐄', 0, 37,  'carne'),
('pollo',                'Pollo',                              '🐔', 0, 38,  'carne'),
('tacchino',             'Tacchino',                           '🦃', 0, 39,  'carne'),
('agnello',              'Agnello / Montone',                  '🐑', 0, 40,  'carne'),
('coniglio',             'Coniglio',                           '🐇', 0, 41,  'carne'),
('anatra',               'Anatra',                             '🦆', 0, 42,  'carne'),
('cavallo',              'Carne equina',                       '🐴', 0, 43,  'carne'),
('selvaggina',           'Selvaggina (cinghiale, cervo…)',     '🦌', 0, 44,  'carne'),
('prosciutto',           'Salumi / Prosciutto',                '🥩', 0, 45,  'carne'),
('pancetta',             'Pancetta / Bacon',                   '🥓', 0, 46,  'carne'),

-- --- Latticini (dettaglio) ---
('burro',                'Burro',                              '🧈', 0, 47,  'latticini'),
('panna',                'Panna da cucina',                    '🥛', 0, 48,  'latticini'),
('yogurt',               'Yogurt',                             '🥛', 0, 49,  'latticini'),
('parmigiano',           'Parmigiano / Grana',                 '🧀', 0, 50,  'latticini'),
('mozzarella',           'Mozzarella / Fior di latte',         '🧀', 0, 51,  'latticini'),
('gorgonzola',           'Gorgonzola / Formaggi erborinati',   '🧀', 0, 52,  'latticini'),
('pecorino',             'Pecorino / Formaggi di pecora',      '🧀', 0, 53,  'latticini'),
('ricotta',              'Ricotta',                            '🧀', 0, 54,  'latticini'),
('mascarpone',           'Mascarpone',                         '🧀', 0, 55,  'latticini'),
('formaggi_stagionati',  'Formaggi stagionati',                '🧀', 0, 56,  'latticini'),

-- --- Legumi (dettaglio) ---
('ceci',                 'Ceci',                               '🫘', 0, 57,  'legumi'),
('fave',                 'Fave',                               '🫘', 0, 58,  'legumi'),
('edamame',              'Edamame / Soia verde',               '🫘', 0, 59,  'legumi'),
('carruba',              'Carruba',                            '🌿', 0, 60,  'legumi'),
('tamarindo',            'Tamarindo',                          '🌿', 0, 61,  'legumi'),

-- --- Frutta a guscio (dettaglio) ---
('mandorle',             'Mandorle',                           '🌰', 0, 20,  'frutta_guscio'),
('nocciole',             'Nocciole',                           '🌰', 0, 21,  'frutta_guscio'),
('noci',                 'Noci',                               '🌰', 0, 22,  'frutta_guscio'),
('noci_pecan',           'Noci pecan',                         '🌰', 0, 23,  'frutta_guscio'),
('noci_brasiliane',      'Noci brasiliane',                    '🌰', 0, 24,  'frutta_guscio'),
('pistacchi',            'Pistacchi',                          '🌰', 0, 25,  'frutta_guscio'),
('anacardi',             'Anacardi',                           '🌰', 0, 26,  'frutta_guscio'),
('castagne',             'Castagne',                           '🌰', 0, 27,  'frutta_guscio'),
('pinoli',               'Pinoli',                             '🌰', 0, 28,  'frutta_guscio'),
('macadamia',            'Noci macadamia',                     '🌰', 0, 29,  'frutta_guscio'),

-- --- Frutta ---
('fragole',              'Fragole',                            '🍓', 0, 30,  'frutta'),
('kiwi',                 'Kiwi',                               '🥝', 0, 31,  'frutta'),
('mela',                 'Mela',                               '🍎', 0, 32,  'frutta'),
('pesca',                'Pesca',                              '🍑', 0, 33,  'frutta'),
('arancia',              'Arancia',                            '🍊', 0, 34,  'frutta'),
('limone',               'Limone',                             '🍋', 0, 35,  'frutta'),
('agrumi',               'Agrumi',                             '🍊', 0, 36,  'frutta'),
('banana',               'Banana',                             '🍌', 0, 37,  'frutta'),
('uva',                  'Uva',                                '🍇', 0, 38,  'frutta'),
('anguria',              'Anguria',                            '🍉', 0, 39,  'frutta'),
('melone',               'Melone',                             '🍈', 0, 40,  'frutta'),
('ananas',               'Ananas',                             '🍍', 0, 41,  'frutta'),
('mango',                'Mango',                              '🥭', 0, 42,  'frutta'),
('avocado',              'Avocado',                            '🥑', 0, 43,  'frutta'),
('albicocca',            'Albicocca',                          '🍑', 0, 44,  'frutta'),
('ciliegia',             'Ciliegia',                           '🍒', 0, 45,  'frutta'),
('pera',                 'Pera',                               '🍐', 0, 46,  'frutta'),
('prugna',               'Prugna',                             '🫐', 0, 47,  'frutta'),
('lamponi',              'Lamponi',                            '🫐', 0, 48,  'frutta'),
('mirtilli',             'Mirtilli',                           '🫐', 0, 49,  'frutta'),
('cocco',                'Cocco',                              '🥥', 0, 50,  'frutta'),
('frutti_di_bosco',      'Frutti di bosco',                    '🫐', 0, 51,  'frutta'),

-- --- Verdura e ortaggi ---
('pomodoro',             'Pomodoro',                           '🍅', 0, 60,  'verdura'),
('aglio',                'Aglio',                              '🧄', 0, 61,  'verdura'),
('cipolla',              'Cipolla',                            '🧅', 0, 62,  'verdura'),
('carota',               'Carota',                             '🥕', 0, 63,  'verdura'),
('funghi',               'Funghi',                             '🍄', 0, 64,  'verdura'),
('mais',                 'Mais',                               '🌽', 0, 65,  'verdura'),
('peperoncino',          'Peperoncino',                        '🌶️', 0, 66,  'verdura'),
('peperone',             'Peperone',                           '🫑', 0, 67,  'verdura'),
('melanzana',            'Melanzana',                          '🍆', 0, 68,  'verdura'),
('zucchina',             'Zucchina',                           '🥒', 0, 69,  'verdura'),
('spinaci',              'Spinaci',                            '🥬', 0, 70,  'verdura'),
('broccoli',             'Broccoli',                           '🥦', 0, 71,  'verdura'),
('cavolfiore',           'Cavolfiore',                         '🥦', 0, 72,  'verdura'),
('cavolo',               'Cavolo',                             '🥬', 0, 73,  'verdura'),
('patata',               'Patata',                             '🥔', 0, 74,  'verdura'),
('piselli',              'Piselli',                            '🫛', 0, 75,  'verdura'),
('fagioli',              'Fagioli',                            '🫘', 0, 76,  'verdura'),
('lenticchie',           'Lenticchie',                         '🫘', 0, 77,  'verdura'),
('cetriolo',             'Cetriolo',                           '🥒', 0, 78,  'verdura'),
('lattuga',              'Lattuga e insalata',                 '🥬', 0, 79,  'verdura'),
('rucola',               'Rucola',                             '🥬', 0, 80,  'verdura'),
('barbabietola',         'Barbabietola',                       '🫚', 0, 81,  'verdura'),
('finocchio',            'Finocchio',                          '🌿', 0, 82,  'verdura'),
('asparagi',             'Asparagi',                           '🌿', 0, 83,  'verdura'),
('carciofi',             'Carciofi',                           '🌿', 0, 84,  'verdura'),
('porri',                'Porri',                              '🧅', 0, 85,  'verdura'),

-- --- Cereali e derivati ---
('riso',                 'Riso',                               '🍚', 0, 90,  'cereali'),
('avena',                'Avena',                              '🌾', 0, 91,  'cereali'),
('segale',               'Segale',                             '🌾', 0, 92,  'cereali'),
('orzo',                 'Orzo',                               '🌾', 0, 93,  'cereali'),
('quinoa',               'Quinoa',                             '🌾', 0, 94,  'cereali'),
('farro',                'Farro',                              '🌾', 0, 95,  'cereali'),
('grano_saraceno',       'Grano saraceno',                     '🌾', 0, 96,  'cereali'),
('teff',                 'Teff',                               '🌾', 0, 97,  'cereali'),
('amaranto',             'Amaranto',                           '🌾', 0, 98,  'cereali'),

-- --- Spezie e aromi ---
('cannella',             'Cannella',                           '🟤', 0, 100, 'spezie'),
('vaniglia',             'Vaniglia',                           '🌼', 0, 101, 'spezie'),
('pepe',                 'Pepe',                               '⚫', 0, 102, 'spezie'),
('curry',                'Curry',                              '🟡', 0, 103, 'spezie'),
('zenzero',              'Zenzero',                            '🫚', 0, 104, 'spezie'),
('noce_moscata',         'Noce moscata',                       '🟤', 0, 105, 'spezie'),
('chiodi_di_garofano',   'Chiodi di garofano',                 '🌿', 0, 106, 'spezie'),
('paprika',              'Paprika',                            '🌶️', 0, 107, 'spezie'),
('cumino',               'Cumino',                             '🟤', 0, 108, 'spezie'),
('origano',              'Origano',                            '🌿', 0, 109, 'spezie'),
('rosmarino',            'Rosmarino',                          '🌿', 0, 110, 'spezie'),
('timo',                 'Timo',                               '🌿', 0, 111, 'spezie'),
('salvia',               'Salvia',                             '🌿', 0, 112, 'spezie'),
('anice',                'Anice',                              '🌿', 0, 113, 'spezie'),
('curcuma',              'Curcuma',                            '🟡', 0, 114, 'spezie'),
('coriandolo',           'Coriandolo',                         '🌿', 0, 115, 'spezie'),
('alloro',               'Alloro',                             '🌿', 0, 116, 'spezie'),

-- --- Intolleranze alimentari ---
('istamina',             'Istamina',                           '🧪', 0, 120, 'intolleranze'),
('fruttosio',            'Fruttosio',                          '🍬', 0, 121, 'intolleranze'),
('sorbitolo',            'Sorbitolo',                          '🍬', 0, 122, 'intolleranze'),
('caffeina',             'Caffeina',                           '☕', 0, 123, 'intolleranze'),
('alcool',               'Alcool',                             '🍷', 0, 124, 'intolleranze'),
('nichel',               'Nichel',                             '⚙️', 0, 125, 'intolleranze'),
('solanacee',            'Solanacee',                          '🍆', 0, 126, 'intolleranze'),
('caseina',              'Caseina',                            '🥛', 0, 127, 'intolleranze'),
('glutammato',           'Glutammato',                         '🧂', 0, 128, 'intolleranze'),
('fosfati',              'Fosfati alimentari',                 '🧪', 0, 129, 'intolleranze'),
('nitriti',              'Nitriti / nitrati',                  '🧪', 0, 130, 'intolleranze'),
('lattosio',             'Lattosio',                           '🥛', 0, 131, 'intolleranze'),
('saccarosio',           'Saccarosio / Zucchero da tavola',    '🍬', 0, 132, 'intolleranze'),
('tannini',              'Tannini',                            '🍷', 0, 133, 'intolleranze'),
('tirammina',            'Tirammina',                          '🧪', 0, 134, 'intolleranze'),
('ammine_biogene',       'Ammine biogene',                     '🧪', 0, 135, 'intolleranze'),
('ossalati',             'Ossalati',                           '🧪', 0, 136, 'intolleranze'),
('salicilati',           'Salicilati',                         '💊', 0, 137, 'intolleranze'),
('fodmap',               'FODMAP (alto contenuto)',             '🧪', 0, 138, 'intolleranze'),
('glutammina',           'Glutammina',                         '🧪', 0, 139, 'intolleranze'),
('lievito',              'Lievito',                            '🍞', 0, 140, 'intolleranze'),
('aceto',                'Aceto',                              '🫙', 0, 141, 'intolleranze'),
('cioccolato',           'Cioccolato / Cacao',                 '🍫', 0, 142, 'intolleranze'),
('coloranti',            'Coloranti alimentari',               '🎨', 0, 143, 'intolleranze'),
('conservanti',          'Conservanti alimentari',             '🧪', 0, 144, 'intolleranze'),
('dolcificanti',         'Dolcificanti artificiali',           '🍬', 0, 145, 'intolleranze'),
('glutammato_monosodico','Glutammato monosodico (MSG)',         '🧂', 0, 146, 'intolleranze'),

-- --- Preferenze alimentari ---
('halal',                'Halal',                              '☪️', 1, 152, 'preferenze'),
('kosher',               'Kosher',                             '✡️', 1, 153, 'preferenze'),
('senza_glutine',        'Senza glutine',                      '🌾', 1, 154, 'preferenze'),
('senza_lattosio',       'Senza lattosio',                     '🥛', 1, 155, 'preferenze'),
('pescetariano',         'Pescetariano',                       '🐟', 1, 156, 'preferenze'),
('senza_zucchero',       'Senza zucchero aggiunto',            '🚫', 1, 157, 'preferenze'),
('senza_sale',           'A basso contenuto di sale',          '🧂', 1, 158, 'preferenze'),
('low_fodmap',           'Low-FODMAP',                         '🥗', 1, 159, 'preferenze'),
('raw_food',             'Raw food / Crudismo',                '🥦', 1, 160, 'preferenze'),
('senza_carne_rossa',    'Senza carne rossa',                  '🥩', 1, 161, 'preferenze'),
('bio',                  'Biologico / Organic',                '🌱', 1, 162, 'preferenze'),
('senza_maiale',         'Senza maiale',                       '🐷', 1, 163, 'preferenze'),
('senza_alcool',         'Senza alcool',                       '🍷', 1, 164, 'preferenze'),
('senza_crostacei',      'Senza crostacei e molluschi',        '🦐', 1, 165, 'preferenze'),
('dieta_mediterranea',   'Dieta mediterranea',                 '🫒', 1, 166, 'preferenze'),
('keto',                 'Chetogenica (Keto)',                 '🥑', 1, 167, 'preferenze'),
('paleo',                'Paleo',                              '🥩', 1, 168, 'preferenze');

-- ============================================================
-- STEP 4: Aggiorna AUTO_INCREMENT (191 record totali)
-- ============================================================
ALTER TABLE `allergens`
  MODIFY `id` tinyint(3) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=192;

-- ============================================================
-- Verifica finale: conta i record inseriti
-- ============================================================
-- SELECT COUNT(*) AS totale_allergeni FROM `allergens`;
-- Risultato atteso: 191
