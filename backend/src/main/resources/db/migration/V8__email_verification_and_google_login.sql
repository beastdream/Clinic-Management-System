-- =====================================================================
-- V8: Xác thực email cho tài khoản bệnh nhân & Đăng nhập bằng Google
-- =====================================================================

-- 1. Bổ sung cột cho bảng users
ALTER TABLE users
    MODIFY COLUMN password_hash VARCHAR(255) NULL COMMENT 'NULL với tài khoản chỉ đăng nhập bằng Google',
    ADD COLUMN email_verified_at DATETIME NULL AFTER email,
    ADD COLUMN auth_provider VARCHAR(20) NOT NULL DEFAULT 'LOCAL' COMMENT 'LOCAL, GOOGLE' AFTER password_hash,
    ADD COLUMN google_subject VARCHAR(255) NULL COMMENT 'Mã định danh (sub) của tài khoản Google' AFTER auth_provider,
    ADD CONSTRAINT uk_users_google_subject UNIQUE (google_subject);

-- Tài khoản đã tồn tại trước khi có tính năng xác thực email được coi là đã xác thực
UPDATE users SET email_verified_at = CURRENT_TIMESTAMP WHERE email_verified_at IS NULL;

-- 2. Bảng token xác thực email (chỉ lưu SHA-256 của token, không lưu token gốc)
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    token_hash CHAR(64) NOT NULL,
    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_email_verification_tokens PRIMARY KEY (id),
    CONSTRAINT uk_email_verification_token_hash UNIQUE (token_hash),
    CONSTRAINT fk_email_verification_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_email_verification_user (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
