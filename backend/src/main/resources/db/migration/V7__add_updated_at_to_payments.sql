-- =============================================================================
-- Migration V7: Bổ sung cột updated_at cho bảng payments đảm bảo tính tương thích với BaseEntity JPA
-- =============================================================================

ALTER TABLE payments 
ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

