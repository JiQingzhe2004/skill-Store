CREATE DATABASE IF NOT EXISTS skill_store_shadow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

GRANT ALL PRIVILEGES ON skill_store.* TO 'skill_store'@'%';
GRANT ALL PRIVILEGES ON skill_store_shadow.* TO 'skill_store'@'%';
FLUSH PRIVILEGES;
