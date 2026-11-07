-- =============================================================================
-- Migration V9: Khởi tạo bảng Cài đặt hệ thống (System Settings)
-- Hỗ trợ cấu hình bảo mật đăng nhập sai, thời gian khóa, chế độ bảo trì
-- =============================================================================

CREATE TABLE IF NOT EXISTS system_settings (
    id CHAR(36) NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT NOT NULL,
    setting_group VARCHAR(50) NOT NULL DEFAULT 'SYSTEM',
    description VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_system_settings PRIMARY KEY (id),
    CONSTRAINT uk_system_settings_key UNIQUE (setting_key),
    INDEX idx_system_settings_group (setting_group)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO system_settings (id, setting_key, setting_value, setting_group, description) VALUES
('b0000000-0000-0000-0000-000000000001', 'security.max_failed_login_attempts', '5', 'SECURITY', 'Số lần đăng nhập sai tối đa trước khi tạm khóa tài khoản'),
('b0000000-0000-0000-0000-000000000002', 'security.lockout_duration_minutes', '15', 'SECURITY', 'Thời gian tạm khóa tài khoản khi vượt quá số lần nhập sai (phút)'),
('b0000000-0000-0000-0000-000000000003', 'security.password_min_length', '8', 'SECURITY', 'Độ dài tối thiểu của mật khẩu người dùng'),
('b0000000-0000-0000-0000-000000000004', 'system.maintenance_mode', 'false', 'MAINTENANCE', 'Chế độ bảo trì toàn hệ thống (chỉ Quản trị viên được truy cập)'),
('b0000000-0000-0000-0000-000000000005', 'system.maintenance_message', 'Hệ thống phòng khám đang bảo trì định kỳ để nâng cấp. Vui lòng quay lại sau.', 'MAINTENANCE', 'Thông báo hiển thị cho người dùng khi bảo trì'),
('b0000000-0000-0000-0000-000000000006', 'system.allow_patient_registration', 'true', 'GENERAL', 'Cho phép bệnh nhân mới tự đăng ký tài khoản qua cổng trực tuyến')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

