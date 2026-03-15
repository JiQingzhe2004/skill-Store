-- CreateTable
CREATE TABLE `skill_version_files` (
    `id` VARCHAR(191) NOT NULL,
    `version_id` VARCHAR(191) NOT NULL,
    `path` VARCHAR(512) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `encoding` VARCHAR(16) NOT NULL DEFAULT 'utf8',
    `size` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `skill_version_files_version_id_idx`(`version_id`),
    UNIQUE INDEX `skill_version_files_version_id_path_key`(`version_id`, `path`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `skill_version_files` ADD CONSTRAINT `skill_version_files_version_id_fkey` FOREIGN KEY (`version_id`) REFERENCES `skill_versions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
