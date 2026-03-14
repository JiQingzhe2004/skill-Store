-- CreateTable
CREATE TABLE `skills` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(128) NOT NULL,
    `name` VARCHAR(128) NOT NULL,
    `description` VARCHAR(512) NOT NULL,
    `tags` VARCHAR(512) NOT NULL DEFAULT '',
    `visibility` ENUM('PUBLIC', 'UNLISTED', 'PRIVATE') NOT NULL DEFAULT 'PUBLIC',
    `status` ENUM('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'ARCHIVED', 'REJECTED') NOT NULL DEFAULT 'DRAFT',
    `latest_version` VARCHAR(32) NULL,
    `author_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `skills_slug_key`(`slug`),
    INDEX `skills_author_id_idx`(`author_id`),
    INDEX `skills_status_visibility_idx`(`status`, `visibility`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `skill_versions` (
    `id` VARCHAR(191) NOT NULL,
    `skill_id` VARCHAR(191) NOT NULL,
    `version` VARCHAR(32) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `changelog` TEXT NULL,
    `published_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `skill_versions_skill_id_idx`(`skill_id`),
    UNIQUE INDEX `skill_versions_skill_id_version_key`(`skill_id`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_installed_skills` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `skill_id` VARCHAR(191) NOT NULL,
    `installed_version` VARCHAR(32) NOT NULL,
    `track_latest` BOOLEAN NOT NULL DEFAULT true,
    `installed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `user_installed_skills_user_id_idx`(`user_id`),
    INDEX `user_installed_skills_skill_id_idx`(`skill_id`),
    UNIQUE INDEX `user_installed_skills_user_id_skill_id_key`(`user_id`, `skill_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `skills` ADD CONSTRAINT `skills_author_id_fkey` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `skill_versions` ADD CONSTRAINT `skill_versions_skill_id_fkey` FOREIGN KEY (`skill_id`) REFERENCES `skills`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_installed_skills` ADD CONSTRAINT `user_installed_skills_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_installed_skills` ADD CONSTRAINT `user_installed_skills_skill_id_fkey` FOREIGN KEY (`skill_id`) REFERENCES `skills`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_installed_skills` ADD CONSTRAINT `user_installed_skills_skill_id_installed_version_fkey` FOREIGN KEY (`skill_id`, `installed_version`) REFERENCES `skill_versions`(`skill_id`, `version`) ON DELETE RESTRICT ON UPDATE CASCADE;
