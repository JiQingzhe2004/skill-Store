-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `username` VARCHAR(32) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `is_email_verified` BOOLEAN NOT NULL DEFAULT false,
    `role` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `last_login_at` DATETIME(3) NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `email_codes` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `purpose` ENUM('REGISTER', 'RESET_PASSWORD') NOT NULL,
    `code` VARCHAR(6) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `used_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `email_codes_user_id_purpose_created_at_idx`(`user_id`, `purpose`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `email_codes` ADD CONSTRAINT `email_codes_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
