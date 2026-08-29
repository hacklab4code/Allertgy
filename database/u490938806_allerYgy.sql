-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Creato il: Lug 07, 2026 alle 09:54
-- Versione del server: 11.8.8-MariaDB-log
-- Versione PHP: 7.2.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `u490938806_allerYgy`
--

-- --------------------------------------------------------

--
-- Struttura della tabella `allergens`
--

CREATE TABLE `allergens` (
  `id` tinyint(3) UNSIGNED NOT NULL,
  `code` varchar(30) NOT NULL,
  `name_it` varchar(100) NOT NULL,
  `emoji` varchar(8) DEFAULT NULL,
  `is_diet` tinyint(1) NOT NULL DEFAULT 0,
  `sort_order` tinyint(3) UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Dump dei dati per la tabella `allergens`
--

INSERT INTO `allergens` (`id`, `code`, `name_it`, `emoji`, `is_diet`, `sort_order`) VALUES
(1, 'glutine', 'Cereali contenenti glutine', '🌾', 0, 1),
(2, 'crostacei', 'Crostacei', '🦐', 0, 2),
(3, 'uova', 'Uova', '🥚', 0, 3),
(4, 'pesce', 'Pesce', '🐟', 0, 4),
(5, 'arachidi', 'Arachidi', '🥜', 0, 5),
(6, 'soia', 'Soia', '🌱', 0, 6),
(7, 'latte', 'Latte e lattosio', '🥛', 0, 7),
(8, 'frutta_a_guscio', 'Frutta a guscio', '🌰', 0, 8),
(9, 'sedano', 'Sedano', '🥬', 0, 9),
(10, 'senape', 'Senape', '🟡', 0, 10),
(11, 'sesamo', 'Semi di sesamo', '⚪', 0, 11),
(12, 'solfiti', 'Anidride solforosa e solfiti', '🍷', 0, 12),
(13, 'lupini', 'Lupini', '🫘', 0, 13),
(14, 'molluschi', 'Molluschi', '🦑', 0, 14),
(15, 'vegano', 'Vegano', '🌿', 1, 15),
(16, 'vegetariano', 'Vegetariano', '🥗', 1, 16);

-- --------------------------------------------------------

--
-- Struttura della tabella `allergen_extractions`
--

CREATE TABLE `allergen_extractions` (
  `id` int(10) UNSIGNED NOT NULL,
  `document_id` int(10) UNSIGNED NOT NULL,
  `allergen_code` varchar(30) NOT NULL,
  `confidence` decimal(3,2) DEFAULT NULL,
  `applied` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Struttura della tabella `device_tokens`
--

CREATE TABLE `device_tokens` (
  `user_id` int(10) UNSIGNED NOT NULL,
  `expo_token` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Dump dei dati per la tabella `device_tokens`
--

INSERT INTO `device_tokens` (`user_id`, `expo_token`, `created_at`) VALUES
(1, 'ExponentPushToken[test-abc-123]', '2026-07-06 20:03:01');

-- --------------------------------------------------------

--
-- Struttura della tabella `dishes`
--

CREATE TABLE `dishes` (
  `id` int(10) UNSIGNED NOT NULL,
  `restaurant_id` int(10) UNSIGNED NOT NULL,
  `name` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `category` varchar(60) DEFAULT NULL,
  `price_cents` int(10) UNSIGNED DEFAULT NULL,
  `is_available` tinyint(1) NOT NULL DEFAULT 1,
  `image_url` varchar(500) DEFAULT NULL,
  `menu_group` varchar(100) DEFAULT 'Principale'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Dump dei dati per la tabella `dishes`
--

INSERT INTO `dishes` (`id`, `restaurant_id`, `name`, `description`, `category`, `price_cents`, `is_available`, `image_url`, `menu_group`) VALUES
(1, 1, 'Bruschette al pomodoro', 'Pane tostato, pomodoro, basilico', 'Antipasti', 500, 1, NULL, 'Principale'),
(2, 1, 'Insalata di mare', 'Polpo, gamberi, sedano', 'Antipasti', 1400, 1, NULL, 'Principale'),
(3, 1, 'Spaghetti alla carbonara', 'Guanciale, uova, pecorino', 'Primi', 1200, 1, NULL, 'Principale'),
(4, 1, 'Risotto alla milanese', 'Zafferano, burro, parmigiano', 'Primi', 1300, 1, NULL, 'Principale'),
(5, 1, 'Frittura di calamari', 'Calamari, farina di grano', 'Secondi', 1500, 1, NULL, 'Principale'),
(6, 1, 'Tagliata di manzo', 'Manzo, rucola, olio EVO', 'Secondi', 1800, 1, NULL, 'Principale'),
(7, 1, 'Grigliata di verdure', 'Verdure di stagione, olio EVO', 'Contorni', 700, 1, NULL, 'Principale'),
(8, 1, 'Tiramisù', 'Mascarpone, savoiardi, caffè', 'Dolci', 600, 1, NULL, 'Principale');

-- --------------------------------------------------------

--
-- Struttura della tabella `dish_allergens`
--

CREATE TABLE `dish_allergens` (
  `dish_id` int(10) UNSIGNED NOT NULL,
  `allergen_id` tinyint(3) UNSIGNED NOT NULL,
  `kind` enum('contains','traces') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Dump dei dati per la tabella `dish_allergens`
--

INSERT INTO `dish_allergens` (`dish_id`, `allergen_id`, `kind`) VALUES
(1, 1, 'contains'),
(3, 1, 'contains'),
(5, 1, 'contains'),
(8, 1, 'contains'),
(2, 2, 'contains'),
(5, 2, 'traces'),
(3, 3, 'contains'),
(8, 3, 'contains'),
(2, 4, 'traces'),
(5, 4, 'traces'),
(3, 7, 'contains'),
(4, 7, 'contains'),
(8, 7, 'contains'),
(8, 8, 'traces'),
(2, 9, 'contains'),
(4, 9, 'traces'),
(7, 12, 'traces'),
(2, 14, 'contains'),
(5, 14, 'contains');

-- --------------------------------------------------------

--
-- Struttura della tabella `document_access_log`
--

CREATE TABLE `document_access_log` (
  `id` int(10) UNSIGNED NOT NULL,
  `document_id` int(10) UNSIGNED NOT NULL,
  `accessed_by` int(10) UNSIGNED NOT NULL,
  `accessed_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Struttura della tabella `invoices`
--

CREATE TABLE `invoices` (
  `id` int(10) UNSIGNED NOT NULL,
  `restaurant_id` int(10) UNSIGNED NOT NULL,
  `stripe_invoice_id` varchar(100) NOT NULL,
  `amount_cents` int(11) NOT NULL,
  `status` varchar(30) NOT NULL,
  `pdf_url` varchar(500) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Struttura della tabella `medical_documents`
--

CREATE TABLE `medical_documents` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `storage_key` varchar(255) NOT NULL,
  `filename` varchar(255) NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `status` enum('pending','processed','failed') NOT NULL DEFAULT 'pending',
  `ai_consent_at` datetime DEFAULT NULL,
  `uploaded_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Struttura della tabella `menu_audit_logs`
--

CREATE TABLE `menu_audit_logs` (
  `id` int(10) UNSIGNED NOT NULL,
  `restaurant_id` int(10) UNSIGNED NOT NULL,
  `owner_user_id` int(10) UNSIGNED DEFAULT NULL,
  `action` enum('menu_saved','menu_approved','restaurant_updated') NOT NULL,
  `menu_version` int(11) NOT NULL DEFAULT 0,
  `legal_version` varchar(40) DEFAULT NULL,
  `snapshot_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`snapshot_json`)),
  `note` varchar(500) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Struttura della tabella `notifications`
--

CREATE TABLE `notifications` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `type` varchar(50) NOT NULL,
  `payload_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`payload_json`)),
  `read_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Dump dei dati per la tabella `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `type`, `payload_json`, `read_at`, `created_at`) VALUES
(1, 1, 'review_reply', '{\"public_code\": \"100001\", \"review_id\": 1}', NULL, '2026-07-06 20:03:00'),
(2, 1, 'review_reply', '{\"public_code\": \"100001\", \"review_id\": 1}', NULL, '2026-07-07 06:30:41'),
(3, 2, 'review_received', '{\"public_code\": \"100001\", \"review_id\": 2, \"rating\": 5}', '2026-07-07 07:51:26', '2026-07-07 07:48:44');

-- --------------------------------------------------------

--
-- Struttura della tabella `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `token_hash` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `requested_ip` varchar(45) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Dump dei dati per la tabella `password_reset_tokens`
--

INSERT INTO `password_reset_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `used_at`, `requested_ip`, `created_at`) VALUES
(1, 1, 'c462afefcbe02f75e8870dcaa5347349f38082f066fcb4c363c2ba4bda506ac8', '2026-07-06 20:31:23', NULL, '127.0.0.1', '2026-07-06 20:01:23'),
(2, 1, '2bc983a829dcd5657627cc3afcbe01b8f3a7e634a8e768d7ccd95e7420a112c4', '2026-07-06 20:32:56', NULL, '127.0.0.1', '2026-07-06 20:02:56'),
(3, 1, '85c1959a74a853c2dbb667e492e9042017d7e20b35b92b3d72291ce3a3330fd8', '2026-07-07 07:00:36', NULL, '127.0.0.1', '2026-07-07 06:30:36');

-- --------------------------------------------------------

--
-- Struttura della tabella `restaurants`
--

CREATE TABLE `restaurants` (
  `id` int(10) UNSIGNED NOT NULL,
  `public_code` char(6) NOT NULL,
  `name` varchar(150) NOT NULL,
  `city` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `owner_user_id` int(10) UNSIGNED DEFAULT NULL,
  `menu_updated_at` datetime DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `address` varchar(500) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `email_contact` varchar(255) DEFAULT NULL,
  `opening_hours` varchar(1000) DEFAULT NULL,
  `menu_legal_confirmed_at` datetime DEFAULT NULL,
  `menu_legal_confirmed_by` int(10) UNSIGNED DEFAULT NULL,
  `menu_legal_version` varchar(40) DEFAULT NULL,
  `menu_version` int(11) NOT NULL DEFAULT 0,
  `business_plan` varchar(30) NOT NULL DEFAULT 'free',
  `subscription_status` varchar(30) NOT NULL DEFAULT 'free',
  `plan_price_cents` int(11) NOT NULL DEFAULT 0,
  `is_verified` tinyint(1) NOT NULL DEFAULT 0,
  `featured_priority` int(11) NOT NULL DEFAULT 0,
  `plan_started_at` datetime DEFAULT NULL,
  `trial_ends_at` datetime DEFAULT NULL,
  `billing_email` varchar(255) DEFAULT NULL,
  `vat_number` varchar(50) DEFAULT NULL,
  `sdi_code` varchar(20) DEFAULT NULL,
  `pec_email` varchar(255) DEFAULT NULL,
  `commercial_notes` varchar(1000) DEFAULT NULL,
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  `slug` varchar(160) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `stripe_customer_id` varchar(100) DEFAULT NULL,
  `stripe_subscription_id` varchar(100) DEFAULT NULL,
  `stripe_price_id` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Dump dei dati per la tabella `restaurants`
--

INSERT INTO `restaurants` (`id`, `public_code`, `name`, `city`, `is_active`, `created_at`, `owner_user_id`, `menu_updated_at`, `image_url`, `address`, `phone`, `email_contact`, `opening_hours`, `menu_legal_confirmed_at`, `menu_legal_confirmed_by`, `menu_legal_version`, `menu_version`, `business_plan`, `subscription_status`, `plan_price_cents`, `is_verified`, `featured_priority`, `plan_started_at`, `trial_ends_at`, `billing_email`, `vat_number`, `sdi_code`, `pec_email`, `commercial_notes`, `latitude`, `longitude`, `slug`, `website`, `description`, `stripe_customer_id`, `stripe_subscription_id`, `stripe_price_id`) VALUES
(1, '100001', 'Trattoria Da Matteo', 'Milano', 1, '2026-07-06 10:11:02', 2, '2026-07-06 10:11:02', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=200&h=200&q=80', NULL, NULL, NULL, NULL, '2026-07-06 12:48:28', 2, '2026-07-06', 1, 'pro', 'comped', 0, 1, 0, NULL, NULL, NULL, NULL, NULL, NULL, 'Demo: piano Pro omaggio per testare menu, QR e registro allergeni.', 45.4642, 9.19, 'trattoria-da-matteo-milano', NULL, NULL, NULL, NULL, NULL),
(2, '271282', 'Osteria Qui Se Magna', 'Roma', 1, '2026-07-07 08:07:52', 7, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'pro_notify', 'active', 1900, 1, 0, '2026-07-07 08:07:52', '2026-12-31 23:59:59', NULL, NULL, NULL, NULL, 'Piano Pro attivo per Osteria Qui Se Magna', 41.9028, 12.4964, 'osteria-qui-se-magna-roma', NULL, NULL, NULL, NULL, NULL),
(3, '499830', 'alesf', 'roma', 1, '2026-07-07 08:23:07', 9, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'free', 'free', 0, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'alesf-roma', NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Struttura della tabella `restaurant_photos`
--

CREATE TABLE `restaurant_photos` (
  `id` int(10) UNSIGNED NOT NULL,
  `restaurant_id` int(10) UNSIGNED NOT NULL,
  `storage_key` varchar(255) NOT NULL,
  `is_cover` tinyint(1) NOT NULL DEFAULT 0,
  `sort_order` tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Struttura della tabella `reviews`
--

CREATE TABLE `reviews` (
  `id` int(10) UNSIGNED NOT NULL,
  `restaurant_id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `rating` tinyint(3) UNSIGNED NOT NULL,
  `comment` text DEFAULT NULL,
  `is_hidden` tinyint(1) NOT NULL DEFAULT 0,
  `hidden_reason` varchar(255) DEFAULT NULL,
  `reported_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Dump dei dati per la tabella `reviews`
--

INSERT INTO `reviews` (`id`, `restaurant_id`, `user_id`, `rating`, `comment`, `is_hidden`, `hidden_reason`, `reported_count`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 4, 'Aggiornata: sempre bravi.', 0, NULL, 0, '2026-07-06 20:02:59', '2026-07-07 06:30:40'),
(2, 1, 4, 5, 'Personale attentissimo alle allergie, tornerò!', 0, NULL, 0, '2026-07-07 07:48:44', '2026-07-07 07:48:44');

-- --------------------------------------------------------

--
-- Struttura della tabella `review_replies`
--

CREATE TABLE `review_replies` (
  `id` int(10) UNSIGNED NOT NULL,
  `review_id` int(10) UNSIGNED NOT NULL,
  `reply` text NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Dump dei dati per la tabella `review_replies`
--

INSERT INTO `review_replies` (`id`, `review_id`, `reply`, `created_at`) VALUES
(1, 1, 'Grazie mille!', '2026-07-06 20:03:00');

-- --------------------------------------------------------

--
-- Struttura della tabella `users`
--

CREATE TABLE `users` (
  `id` int(10) UNSIGNED NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `display_name` varchar(100) DEFAULT NULL,
  `disclaimer_accepted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `role` enum('customer','owner') NOT NULL DEFAULT 'customer',
  `apple_health_connected` tinyint(1) DEFAULT 0,
  `emergency_medicines` varchar(500) DEFAULT NULL,
  `terms_accepted_at` datetime DEFAULT NULL,
  `privacy_accepted_at` datetime DEFAULT NULL,
  `health_data_consent_at` datetime DEFAULT NULL,
  `legal_terms_version` varchar(40) DEFAULT NULL,
  `privacy_version` varchar(40) DEFAULT NULL,
  `safety_disclaimer_version` varchar(40) DEFAULT NULL,
  `onboarding_completed_at` datetime DEFAULT NULL,
  `photo_key` varchar(255) DEFAULT NULL,
  `emergency_contact_name` varchar(255) DEFAULT NULL,
  `emergency_contact_phone` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Dump dei dati per la tabella `users`
--

INSERT INTO `users` (`id`, `email`, `password_hash`, `display_name`, `disclaimer_accepted_at`, `created_at`, `role`, `apple_health_connected`, `emergency_medicines`, `terms_accepted_at`, `privacy_accepted_at`, `health_data_consent_at`, `legal_terms_version`, `privacy_version`, `safety_disclaimer_version`, `onboarding_completed_at`, `photo_key`, `emergency_contact_name`, `emergency_contact_phone`) VALUES
(1, 'cliente@allertgy.it', '$2b$12$FvAVANbAH2OuZ3ApRD3P/.3r08dKEBTU4fu3EX0tdi7pfGRJ2uzTy', 'Cliente Demo', '2026-07-06 12:48:28', '2026-07-06 10:11:02', 'customer', 0, NULL, '2026-07-06 12:48:28', '2026-07-06 12:48:28', '2026-07-06 12:48:28', '2026-07-06', '2026-07-06', '2026-07-06', '2026-07-06 13:40:04', 'profile/1/d9a397ff-aaad-40d3-8f1b-4baf0b3f454d.jpg', NULL, NULL),
(2, 'ristoratore@allertgy.it', '$2b$12$ng4wpyvhYgh4fy/YqkzlqOmTIU11NnzrfmvFLTEvrxdZpIen4nVvG', 'Matteo Ristoratore', NULL, '2026-07-06 10:11:02', 'owner', 0, NULL, '2026-07-06 12:48:28', '2026-07-06 12:48:28', NULL, '2026-07-06', '2026-07-06', NULL, NULL, NULL, NULL, NULL),
(3, 'user@example.com', '$2b$12$O4ZHbqQjdWqdK0/Y1OzdeePLwDtAwGLPZwKR/LUQdztUFP2Ow/jKS', 'string', NULL, '2026-07-06 10:44:00', 'customer', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(4, 'reviewer3867@allertgy.it', '$2b$12$7IOEWcEAjvLE6CKDkgLG5ebtAu4S2g0Lrhblota1nrVS5FDHqvdQK', 'Giulia Bianchi', NULL, '2026-07-07 07:48:43', 'customer', 0, NULL, '2026-07-07 07:48:42', '2026-07-07 07:48:42', '2026-07-07 07:48:42', '2026-07-06', '2026-07-06', NULL, NULL, NULL, NULL, NULL),
(5, 'fasfadf@gmail.com', '$2b$12$0NVN/W22v2SfrSOOgoURR.hk3irmfUHGv.dBpmQj3O3FPweETjqgu', 'fdsafsa', NULL, '2026-07-07 07:53:12', 'customer', 0, NULL, '2026-07-07 07:53:11', '2026-07-07 07:53:11', '2026-07-07 07:53:11', '2026-07-06', '2026-07-06', NULL, NULL, NULL, NULL, NULL),
(6, 'asfdasdf@gmail.com', '$2b$12$0cwZOmZnAjT0ltBhn0340eidvZZVVxn9poT3FCpYfn48CajUWqw12', 'fasdfsa', NULL, '2026-07-07 08:03:02', 'owner', 0, NULL, '2026-07-07 08:03:01', '2026-07-07 08:03:01', NULL, '2026-07-06', '2026-07-06', NULL, NULL, NULL, NULL, NULL),
(7, 'chef8163@allertgy.it', '$2b$12$549cYeQlKCY0HDTdZIvW1.tcMSAjjTvJzO/29kiZhoI2SuJblL2h.', 'Chef Test', NULL, '2026-07-07 08:07:51', 'owner', 0, NULL, '2026-07-07 08:07:51', '2026-07-07 08:07:51', NULL, '2026-07-06', '2026-07-06', NULL, NULL, NULL, NULL, NULL),
(8, 'sig.demartino.m@gmail.com', '$2b$12$COhwRbbKaM9wnIyxrTFWKuItgzdp9edCpA9/d.Vd8drIZmLFzeICi', 'Matteo', '2026-07-07 08:08:41', '2026-07-07 08:08:26', 'customer', 0, NULL, '2026-07-07 08:08:26', '2026-07-07 08:08:26', '2026-07-07 08:08:26', '2026-07-06', '2026-07-06', '2026-07-06', '2026-07-07 08:08:47', NULL, NULL, NULL),
(9, 'sdfasdfa@gmail.com', '$2b$12$2/6wy6F4U5lXrK8FCnteve2M2br3QYWAFO2VHzfdsYgqIGgGvr1jW', 'fsadfasdf', NULL, '2026-07-07 08:22:57', 'owner', 0, NULL, '2026-07-07 08:22:57', '2026-07-07 08:22:57', NULL, '2026-07-06', '2026-07-06', NULL, NULL, NULL, NULL, NULL),
(10, 'asdfas@gmail.com', '$2b$12$JIMpZb.LKR8OhFOM4n28gOO/fnrE7ZS5N/Dv8XNB5bQ1FdTzAs9gu', 'sadfasd', NULL, '2026-07-07 08:24:49', 'customer', 0, NULL, '2026-07-07 08:24:49', '2026-07-07 08:24:49', '2026-07-07 08:24:49', '2026-07-06', '2026-07-06', NULL, '2026-07-07 08:52:30', NULL, NULL, NULL),
(11, 'sdfasfd@gmail.com', '$2b$12$rX1jbiqmMYMlaju2GPbKuuAZEfbcbCCqFdtsy.8bTbW3.vNSr6DCC', 'asdfas', NULL, '2026-07-07 08:55:44', 'customer', 0, NULL, '2026-07-07 08:55:44', '2026-07-07 08:55:44', '2026-07-07 08:55:44', '2026-07-06', '2026-07-06', NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Struttura della tabella `user_allergens`
--

CREATE TABLE `user_allergens` (
  `user_id` int(10) UNSIGNED NOT NULL,
  `allergen_id` tinyint(3) UNSIGNED NOT NULL,
  `source` enum('manual','document_ai') NOT NULL DEFAULT 'manual',
  `confirmed_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Dump dei dati per la tabella `user_allergens`
--

INSERT INTO `user_allergens` (`user_id`, `allergen_id`, `source`, `confirmed_at`) VALUES
(1, 1, 'document_ai', '2026-07-06 20:01:27'),
(1, 2, 'manual', NULL),
(1, 7, 'manual', NULL),
(2, 1, 'manual', NULL),
(2, 2, 'manual', NULL),
(2, 4, 'manual', NULL),
(2, 5, 'manual', NULL),
(2, 7, 'manual', NULL),
(8, 3, 'manual', '2026-07-07 08:08:47'),
(8, 10, 'manual', '2026-07-07 08:08:47'),
(8, 12, 'manual', '2026-07-07 08:08:47'),
(8, 13, 'manual', '2026-07-07 08:08:47'),
(10, 1, 'manual', '2026-07-07 08:52:30'),
(10, 2, 'manual', '2026-07-07 08:52:30'),
(10, 5, 'manual', '2026-07-07 08:52:30');

-- --------------------------------------------------------

--
-- Struttura della tabella `user_documents`
--

CREATE TABLE `user_documents` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `filename` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'pending',
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Struttura della tabella `user_favorites`
--

CREATE TABLE `user_favorites` (
  `user_id` int(10) UNSIGNED NOT NULL,
  `restaurant_id` int(10) UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Dump dei dati per la tabella `user_favorites`
--

INSERT INTO `user_favorites` (`user_id`, `restaurant_id`, `created_at`) VALUES
(1, 1, '2026-07-06 20:03:00');

--
-- Indici per le tabelle scaricate
--

--
-- Indici per le tabelle `allergens`
--
ALTER TABLE `allergens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indici per le tabelle `allergen_extractions`
--
ALTER TABLE `allergen_extractions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `document_id` (`document_id`);

--
-- Indici per le tabelle `device_tokens`
--
ALTER TABLE `device_tokens`
  ADD PRIMARY KEY (`user_id`,`expo_token`);

--
-- Indici per le tabelle `dishes`
--
ALTER TABLE `dishes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_dishes_restaurant` (`restaurant_id`);

--
-- Indici per le tabelle `dish_allergens`
--
ALTER TABLE `dish_allergens`
  ADD PRIMARY KEY (`dish_id`,`allergen_id`,`kind`),
  ADD KEY `allergen_id` (`allergen_id`);

--
-- Indici per le tabelle `document_access_log`
--
ALTER TABLE `document_access_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `document_id` (`document_id`);

--
-- Indici per le tabelle `invoices`
--
ALTER TABLE `invoices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `stripe_invoice_id` (`stripe_invoice_id`),
  ADD KEY `restaurant_id` (`restaurant_id`);

--
-- Indici per le tabelle `medical_documents`
--
ALTER TABLE `medical_documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indici per le tabelle `menu_audit_logs`
--
ALTER TABLE `menu_audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_menu_audit_restaurant_created` (`restaurant_id`,`created_at`),
  ADD KEY `owner_user_id` (`owner_user_id`);

--
-- Indici per le tabelle `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indici per le tabelle `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_prt_token_hash` (`token_hash`),
  ADD KEY `user_id` (`user_id`);

--
-- Indici per le tabelle `restaurants`
--
ALTER TABLE `restaurants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `public_code` (`public_code`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `fk_restaurants_owner` (`owner_user_id`);

--
-- Indici per le tabelle `restaurant_photos`
--
ALTER TABLE `restaurant_photos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `restaurant_id` (`restaurant_id`);

--
-- Indici per le tabelle `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_review_user_restaurant` (`restaurant_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indici per le tabelle `review_replies`
--
ALTER TABLE `review_replies`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `review_id` (`review_id`);

--
-- Indici per le tabelle `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indici per le tabelle `user_allergens`
--
ALTER TABLE `user_allergens`
  ADD PRIMARY KEY (`user_id`,`allergen_id`),
  ADD KEY `allergen_id` (`allergen_id`);

--
-- Indici per le tabelle `user_documents`
--
ALTER TABLE `user_documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indici per le tabelle `user_favorites`
--
ALTER TABLE `user_favorites`
  ADD PRIMARY KEY (`user_id`,`restaurant_id`),
  ADD KEY `restaurant_id` (`restaurant_id`);

--
-- AUTO_INCREMENT per le tabelle scaricate
--

--
-- AUTO_INCREMENT per la tabella `allergens`
--
ALTER TABLE `allergens`
  MODIFY `id` tinyint(3) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT per la tabella `allergen_extractions`
--
ALTER TABLE `allergen_extractions`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT per la tabella `dishes`
--
ALTER TABLE `dishes`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT per la tabella `document_access_log`
--
ALTER TABLE `document_access_log`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT per la tabella `invoices`
--
ALTER TABLE `invoices`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT per la tabella `medical_documents`
--
ALTER TABLE `medical_documents`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT per la tabella `menu_audit_logs`
--
ALTER TABLE `menu_audit_logs`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT per la tabella `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT per la tabella `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT per la tabella `restaurants`
--
ALTER TABLE `restaurants`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT per la tabella `restaurant_photos`
--
ALTER TABLE `restaurant_photos`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT per la tabella `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT per la tabella `review_replies`
--
ALTER TABLE `review_replies`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT per la tabella `users`
--
ALTER TABLE `users`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT per la tabella `user_documents`
--
ALTER TABLE `user_documents`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Limiti per le tabelle scaricate
--

--
-- Limiti per la tabella `allergen_extractions`
--
ALTER TABLE `allergen_extractions`
  ADD CONSTRAINT `allergen_extractions_ibfk_1` FOREIGN KEY (`document_id`) REFERENCES `medical_documents` (`id`) ON DELETE CASCADE;

--
-- Limiti per la tabella `device_tokens`
--
ALTER TABLE `device_tokens`
  ADD CONSTRAINT `device_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Limiti per la tabella `dishes`
--
ALTER TABLE `dishes`
  ADD CONSTRAINT `dishes_ibfk_1` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE;

--
-- Limiti per la tabella `dish_allergens`
--
ALTER TABLE `dish_allergens`
  ADD CONSTRAINT `dish_allergens_ibfk_1` FOREIGN KEY (`dish_id`) REFERENCES `dishes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `dish_allergens_ibfk_2` FOREIGN KEY (`allergen_id`) REFERENCES `allergens` (`id`) ON DELETE CASCADE;

--
-- Limiti per la tabella `document_access_log`
--
ALTER TABLE `document_access_log`
  ADD CONSTRAINT `document_access_log_ibfk_1` FOREIGN KEY (`document_id`) REFERENCES `medical_documents` (`id`) ON DELETE CASCADE;

--
-- Limiti per la tabella `invoices`
--
ALTER TABLE `invoices`
  ADD CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE;

--
-- Limiti per la tabella `medical_documents`
--
ALTER TABLE `medical_documents`
  ADD CONSTRAINT `medical_documents_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Limiti per la tabella `menu_audit_logs`
--
ALTER TABLE `menu_audit_logs`
  ADD CONSTRAINT `menu_audit_logs_ibfk_1` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `menu_audit_logs_ibfk_2` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Limiti per la tabella `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Limiti per la tabella `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD CONSTRAINT `password_reset_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Limiti per la tabella `restaurants`
--
ALTER TABLE `restaurants`
  ADD CONSTRAINT `fk_restaurants_owner` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Limiti per la tabella `restaurant_photos`
--
ALTER TABLE `restaurant_photos`
  ADD CONSTRAINT `restaurant_photos_ibfk_1` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE;

--
-- Limiti per la tabella `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Limiti per la tabella `review_replies`
--
ALTER TABLE `review_replies`
  ADD CONSTRAINT `review_replies_ibfk_1` FOREIGN KEY (`review_id`) REFERENCES `reviews` (`id`) ON DELETE CASCADE;

--
-- Limiti per la tabella `user_allergens`
--
ALTER TABLE `user_allergens`
  ADD CONSTRAINT `user_allergens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_allergens_ibfk_2` FOREIGN KEY (`allergen_id`) REFERENCES `allergens` (`id`) ON DELETE CASCADE;

--
-- Limiti per la tabella `user_documents`
--
ALTER TABLE `user_documents`
  ADD CONSTRAINT `user_documents_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Limiti per la tabella `user_favorites`
--
ALTER TABLE `user_favorites`
  ADD CONSTRAINT `user_favorites_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_favorites_ibfk_2` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
