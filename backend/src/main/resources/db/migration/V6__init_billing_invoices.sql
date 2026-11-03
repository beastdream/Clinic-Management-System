-- =============================================================================
-- Migration V6: Khởi tạo bảng Hóa đơn viện phí, Chi tiết dịch vụ & Giao dịch thanh toán
-- (Billing Invoices, Invoice Items & Payments Schema)
-- Engine: InnoDB | Charset: utf8mb4 | Collation: utf8mb4_unicode_ci
-- Tiền tệ: DECIMAL(15, 2) chuẩn VNĐ, tuân thủ nguyên tắc No Hard Delete & ACID
-- =============================================================================

-- 1. Bảng INVOICES (Hóa đơn viện phí)
CREATE TABLE IF NOT EXISTS invoices (
    id CHAR(36) NOT NULL,
    invoice_code VARCHAR(30) NOT NULL,
    patient_id CHAR(36) NOT NULL,
    encounter_id CHAR(36) NULL,
    appointment_id CHAR(36) NULL,
    total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    paid_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'UNPAID', -- UNPAID, PAID, CANCELLED
    payment_method VARCHAR(30) NULL,             -- CASH, BANK_TRANSFER
    paid_at DATETIME NULL,
    cashier_id CHAR(36) NULL,
    notes TEXT NULL,
    cancellation_reason VARCHAR(255) NULL,
    created_by CHAR(36) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,

    CONSTRAINT pk_invoices PRIMARY KEY (id),
    CONSTRAINT uk_invoices_code UNIQUE (invoice_code),
    CONSTRAINT fk_invoices_patient FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE RESTRICT,
    CONSTRAINT fk_invoices_encounter FOREIGN KEY (encounter_id) REFERENCES encounters (id) ON DELETE SET NULL,
    CONSTRAINT fk_invoices_appointment FOREIGN KEY (appointment_id) REFERENCES appointments (id) ON DELETE SET NULL,
    CONSTRAINT fk_invoices_cashier FOREIGN KEY (cashier_id) REFERENCES staff_profiles (id) ON DELETE SET NULL,
    INDEX idx_invoices_patient (patient_id),
    INDEX idx_invoices_status (status),
    INDEX idx_invoices_created_at (created_at),
    INDEX idx_invoices_paid_at (paid_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Bảng INVOICE_ITEMS (Các dòng dịch vụ chi tiết trong hóa đơn)
CREATE TABLE IF NOT EXISTS invoice_items (
    id CHAR(36) NOT NULL,
    invoice_id CHAR(36) NOT NULL,
    service_id CHAR(36) NOT NULL,
    service_code VARCHAR(30) NOT NULL,
    service_name VARCHAR(150) NOT NULL,
    unit_price DECIMAL(15, 2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    total_price DECIMAL(15, 2) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_invoice_items PRIMARY KEY (id),
    CONSTRAINT fk_items_invoice FOREIGN KEY (invoice_id) REFERENCES invoices (id) ON DELETE CASCADE,
    CONSTRAINT fk_items_service FOREIGN KEY (service_id) REFERENCES services (id) ON DELETE RESTRICT,
    INDEX idx_items_invoice (invoice_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bảng PAYMENTS (Lịch sử thanh toán giao dịch tài chính)
CREATE TABLE IF NOT EXISTS payments (
    id CHAR(36) NOT NULL,
    payment_code VARCHAR(30) NOT NULL,
    invoice_id CHAR(36) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL, -- CASH, BANK_TRANSFER
    transaction_reference VARCHAR(100) NULL, -- Mã giao dịch ngân hàng / biên nhận
    cashier_id CHAR(36) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS', -- SUCCESS, REFUNDED
    notes VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_payments PRIMARY KEY (id),
    CONSTRAINT uk_payments_code UNIQUE (payment_code),
    CONSTRAINT fk_payments_invoice FOREIGN KEY (invoice_id) REFERENCES invoices (id) ON DELETE RESTRICT,
    CONSTRAINT fk_payments_cashier FOREIGN KEY (cashier_id) REFERENCES staff_profiles (id) ON DELETE SET NULL,
    INDEX idx_payments_invoice (invoice_id),
    INDEX idx_payments_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Dữ liệu mẫu khởi tạo (Demo Billing Seed Data)
-- -----------------------------------------------------------------------------
-- 1. Hóa đơn 1 (Đã thanh toán bằng Tiền mặt)
INSERT INTO invoices (
    id, invoice_code, patient_id, encounter_id, appointment_id,
    total_amount, paid_amount, status, payment_method, paid_at,
    cashier_id, notes, created_by, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0050-000000000001',
    'HD-20261102-001',
    '00000000-0000-0000-0020-000000000001',
    '00000000-0000-0000-0040-000000000001',
    '00000000-0000-0000-0030-000000000001',
    400000.00,
    400000.00,
    'PAID',
    'CASH',
    DATE_SUB(NOW(), INTERVAL 1 DAY),
    '00000000-0000-0000-0010-000000000007',
    'Thanh toán khám nội và siêu âm bụng tổng quát',
    '00000000-0000-0000-0000-000000000022',
    DATE_SUB(NOW(), INTERVAL 1 DAY),
    DATE_SUB(NOW(), INTERVAL 1 DAY)
) ON DUPLICATE KEY UPDATE status=VALUES(status);

INSERT INTO invoice_items (id, invoice_id, service_id, service_code, service_name, unit_price, quantity, total_price)
VALUES 
('00000000-0000-0000-0051-000000000001', '00000000-0000-0000-0050-000000000001', '00000000-0000-0000-0007-000000000001', 'DV_KHAM_NOI', 'Khám Bệnh Nội Tổng Quát', 150000.00, 1, 150000.00),
('00000000-0000-0000-0051-000000000002', '00000000-0000-0000-0050-000000000001', '00000000-0000-0000-0007-000000000005', 'SA_BUNG_TONG_QUAT', 'Siêu Âm Doppler Màu Bụng Tổng Quát', 250000.00, 1, 250000.00)
ON DUPLICATE KEY UPDATE total_price=VALUES(total_price);

INSERT INTO payments (id, payment_code, invoice_id, amount, payment_method, transaction_reference, cashier_id, status, notes, created_at)
VALUES (
    '00000000-0000-0000-0052-000000000001',
    'TT-20261102-001',
    '00000000-0000-0000-0050-000000000001',
    400000.00,
    'CASH',
    'TM-QUAY-01',
    '00000000-0000-0000-0010-000000000007',
    'SUCCESS',
    'Thu tiền mặt trực tiếp tại quầy thu ngân',
    DATE_SUB(NOW(), INTERVAL 1 DAY)
) ON DUPLICATE KEY UPDATE amount=VALUES(amount);

-- 2. Hóa đơn 2 (Đã thanh toán bằng Chuyển khoản)
INSERT INTO invoices (
    id, invoice_code, patient_id, encounter_id, appointment_id,
    total_amount, paid_amount, status, payment_method, paid_at,
    cashier_id, notes, created_by, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0050-000000000002',
    'HD-20261102-002',
    '00000000-0000-0000-0020-000000000002',
    '00000000-0000-0000-0040-000000000002',
    '00000000-0000-0000-0030-000000000002',
    210000.00,
    210000.00,
    'PAID',
    'BANK_TRANSFER',
    DATE_SUB(NOW(), INTERVAL 1 DAY),
    '00000000-0000-0000-0010-000000000007',
    'Thanh toán khám nội và xét nghiệm Glucose',
    '00000000-0000-0000-0000-000000000022',
    DATE_SUB(NOW(), INTERVAL 1 DAY),
    DATE_SUB(NOW(), INTERVAL 1 DAY)
) ON DUPLICATE KEY UPDATE status=VALUES(status);

INSERT INTO invoice_items (id, invoice_id, service_id, service_code, service_name, unit_price, quantity, total_price)
VALUES 
('00000000-0000-0000-0051-000000000003', '00000000-0000-0000-0050-000000000002', '00000000-0000-0000-0007-000000000001', 'DV_KHAM_NOI', 'Khám Bệnh Nội Tổng Quát', 150000.00, 1, 150000.00),
('00000000-0000-0000-0051-000000000004', '00000000-0000-0000-0050-000000000002', '00000000-0000-0000-0007-000000000004', 'XN_SINH_HOA_GLUCOSE', 'Định Lượng Glucose Máu (Đường huyết đói)', 60000.00, 1, 60000.00)
ON DUPLICATE KEY UPDATE total_price=VALUES(total_price);

INSERT INTO payments (id, payment_code, invoice_id, amount, payment_method, transaction_reference, cashier_id, status, notes, created_at)
VALUES (
    '00000000-0000-0000-0052-000000000002',
    'TT-20261102-002',
    '00000000-0000-0000-0050-000000000002',
    210000.00,
    'BANK_TRANSFER',
    'MBB-20261102-98472',
    '00000000-0000-0000-0010-000000000007',
    'SUCCESS',
    'Chuyển khoản QR Napas 24/7',
    DATE_SUB(NOW(), INTERVAL 1 DAY)
) ON DUPLICATE KEY UPDATE amount=VALUES(amount);

-- 3. Hóa đơn 3 (Chưa thanh toán - UNPAID)
INSERT INTO invoices (
    id, invoice_code, patient_id, encounter_id, appointment_id,
    total_amount, paid_amount, status, payment_method, paid_at,
    cashier_id, notes, created_by, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0050-000000000003',
    'HD-20261103-001',
    '00000000-0000-0000-0020-000000000003',
    NULL,
    '00000000-0000-0000-0030-000000000003',
    300000.00,
    0.00,
    'UNPAID',
    NULL,
    NULL,
    NULL,
    'Khám chuyên khoa nhi và xét nghiệm tổng phân tích máu',
    '00000000-0000-0000-0000-000000000021',
    NOW(),
    NOW()
) ON DUPLICATE KEY UPDATE total_amount=VALUES(total_amount);

INSERT INTO invoice_items (id, invoice_id, service_id, service_code, service_name, unit_price, quantity, total_price)
VALUES 
('00000000-0000-0000-0051-000000000005', '00000000-0000-0000-0050-000000000003', '00000000-0000-0000-0007-000000000002', 'DV_KHAM_NHI', 'Khám Bệnh Chuyên Khoa Nhi', 180000.00, 1, 180000.00),
('00000000-0000-0000-0051-000000000006', '00000000-0000-0000-0050-000000000003', '00000000-0000-0000-0007-000000000003', 'XN_CONG_THUC_MAU', 'Tổng Phân Tích Tế Bào Máu (CBC)', 120000.00, 1, 120000.00)
ON DUPLICATE KEY UPDATE total_price=VALUES(total_price);

-- 4. Hóa đơn 4 (Đã hủy - CANCELLED)
INSERT INTO invoices (
    id, invoice_code, patient_id, encounter_id, appointment_id,
    total_amount, paid_amount, status, payment_method, paid_at,
    cashier_id, notes, cancellation_reason, created_by, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0050-000000000004',
    'HD-20261103-002',
    '00000000-0000-0000-0020-000000000004',
    NULL,
    NULL,
    150000.00,
    0.00,
    'CANCELLED',
    NULL,
    NULL,
    NULL,
    'Hóa đơn tạo nhầm dịch vụ',
    'Bệnh nhân đổi ý không làm dịch vụ',
    '00000000-0000-0000-0000-000000000021',
    NOW(),
    NOW()
) ON DUPLICATE KEY UPDATE status=VALUES(status);

