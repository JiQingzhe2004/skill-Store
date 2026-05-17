-- Drop the email verification system.
-- Compatible with both fresh databases (table just got created in earlier migrations)
-- and existing deployments (table/column already populated).

-- DropTable: drop email_codes if present. Disable FK checks to be safe in case the
-- earlier 20260312160320_v1 migration was applied with InnoDB foreign keys.
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `email_codes`;
SET FOREIGN_KEY_CHECKS = 1;

-- DropColumn: drop users.is_email_verified only if it still exists. MySQL 5.7 / 8.0
-- (< 8.0.29) do not support `DROP COLUMN IF EXISTS`, so we use information_schema +
-- prepared statements instead. Each statement is terminated by `;` — no DELIMITER.
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'users'
    AND column_name = 'is_email_verified'
);
SET @stmt := IF(@col_exists > 0,
  'ALTER TABLE `users` DROP COLUMN `is_email_verified`',
  'DO 0'
);
PREPARE pstmt FROM @stmt;
EXECUTE pstmt;
DEALLOCATE PREPARE pstmt;
