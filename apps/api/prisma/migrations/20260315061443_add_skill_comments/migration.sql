-- CreateTable
CREATE TABLE `skill_comments` (
    `id` VARCHAR(191) NOT NULL,
    `skill_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `parent_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `skill_comments_skill_id_idx`(`skill_id`),
    INDEX `skill_comments_user_id_idx`(`user_id`),
    INDEX `skill_comments_parent_id_idx`(`parent_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `skill_comments` ADD CONSTRAINT `skill_comments_skill_id_fkey` FOREIGN KEY (`skill_id`) REFERENCES `skills`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `skill_comments` ADD CONSTRAINT `skill_comments_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `skill_comments` ADD CONSTRAINT `skill_comments_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `skill_comments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
