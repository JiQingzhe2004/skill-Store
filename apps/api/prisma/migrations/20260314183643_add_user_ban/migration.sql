-- AlterTable
ALTER TABLE `users` ADD COLUMN `ban_reason` VARCHAR(256) NULL,
    ADD COLUMN `banned_until` DATETIME(3) NULL,
    ADD COLUMN `is_banned` BOOLEAN NOT NULL DEFAULT false;
