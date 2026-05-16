-- CreateTable
CREATE TABLE `api_clients` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(64) NOT NULL,
    `key_prefix` VARCHAR(16) NOT NULL,
    `api_key_hash` VARCHAR(64) NOT NULL,
    `status` ENUM('ACTIVE', 'REVOKED') NOT NULL DEFAULT 'ACTIVE',
    `last_used_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `api_clients_owner_id_idx`(`owner_id`),
    INDEX `api_clients_api_key_hash_idx`(`api_key_hash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `skill_usage_logs` (
    `id` VARCHAR(191) NOT NULL,
    `skill_id` VARCHAR(191) NULL,
    `api_client_id` VARCHAR(191) NOT NULL,
    `action` VARCHAR(64) NOT NULL,
    `request_ip` VARCHAR(45) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `skill_usage_logs_api_client_id_created_at_idx`(`api_client_id`, `created_at`),
    INDEX `skill_usage_logs_skill_id_idx`(`skill_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `api_clients` ADD CONSTRAINT `api_clients_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `skill_usage_logs` ADD CONSTRAINT `skill_usage_logs_api_client_id_fkey` FOREIGN KEY (`api_client_id`) REFERENCES `api_clients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
