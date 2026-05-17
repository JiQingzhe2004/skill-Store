-- Restore email_codes table + users.is_email_verified column, and switch
-- users.avatar from LongText (base64) to VarChar(512) (URL).
--
-- Compatible with both:
--   * fresh databases (none of these objects exist yet)
--   * existing deployments where the prior drop_email_verification migration
--     has already removed them
--
-- All "alter if exists / does not exist" patterns are expressed with
-- information_schema + PREPARE/EXECUTE to support MySQL 5.7 and 8.0 (< 8.0.29).

-- ─── 1. users.is_email_verified ─────────────────────────────────────
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'users'
    AND column_name = 'is_email_verified'
);
SET @stmt := IF(@col_exists = 0,
  'ALTER TABLE `users` ADD COLUMN `is_email_verified` TINYINT(1) NOT NULL DEFAULT 0 AFTER `password_hash`',
  'DO 0'
);
PREPARE pstmt FROM @stmt;
EXECUTE pstmt;
DEALLOCATE PREPARE pstmt;

-- ─── 2. users.avatar: LongText → VarChar(512) ───────────────────────
-- Existing base64 payloads will no longer fit; clear them first so the
-- type change is safe. Users will need to re-upload (now stored as files).
SET @col_type := (
  SELECT DATA_TYPE FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'users'
    AND column_name = 'avatar'
);
SET @needs_clear := IF(@col_type IS NOT NULL AND @col_type <> 'varchar', 1, 0);
SET @stmt := IF(@needs_clear = 1,
  'UPDATE `users` SET `avatar` = NULL WHERE `avatar` IS NOT NULL',
  'DO 0'
);
PREPARE pstmt FROM @stmt;
EXECUTE pstmt;
DEALLOCATE PREPARE pstmt;

SET @stmt := IF(@col_type IS NULL,
  'ALTER TABLE `users` ADD COLUMN `avatar` VARCHAR(512) NULL',
  IF(@col_type <> 'varchar',
    'ALTER TABLE `users` MODIFY COLUMN `avatar` VARCHAR(512) NULL',
    'DO 0'
  )
);
PREPARE pstmt FROM @stmt;
EXECUTE pstmt;
DEALLOCATE PREPARE pstmt;

-- ─── 3. email_codes table ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `email_codes` (
  `id`         VARCHAR(191) NOT NULL,
  `user_id`    VARCHAR(191) NOT NULL,
  `purpose`    ENUM('REGISTER', 'RESET_PASSWORD') NOT NULL,
  `code`       VARCHAR(6) NOT NULL,
  `expires_at` DATETIME(3) NOT NULL,
  `used_at`    DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `email_codes_user_id_purpose_created_at_idx` (`user_id`, `purpose`, `created_at`),
  CONSTRAINT `email_codes_user_id_fkey`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
