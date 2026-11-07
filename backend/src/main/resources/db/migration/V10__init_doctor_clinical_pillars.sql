-- =============================================================================
-- Migration V10: Hoàn thiện các trụ cột chuyên môn cho Vai trò Bác sĩ (Doctor Role)
-- 1. Bổ sung trường ICD-10, chẩn đoán phụ và hẹn tái khám cho bảng encounters
-- 2. Khởi tạo danh mục chẩn đoán quốc tế ICD-10 (icd10_diseases)
-- 3. Khởi tạo bảng Đơn thuốc điện tử & Chi tiết đơn thuốc (prescriptions, prescription_items)
-- 4. Khởi tạo bảng Chỉ định dịch vụ kỹ thuật & cận lâm sàng (service_orders)
-- 5. Nạp dữ liệu mẫu ban đầu cho ICD-10, đơn thuốc và chỉ định cận lâm sàng
-- =============================================================================

-- 1. Cập nhật bảng ENCOUNTERS
ALTER TABLE encounters
    ADD COLUMN icd10_code VARCHAR(30) NULL AFTER diagnosis,
    ADD COLUMN secondary_diagnoses TEXT NULL AFTER icd10_code,
    ADD COLUMN follow_up_date DATE NULL AFTER treatment_plan,
    ADD COLUMN follow_up_notes TEXT NULL AFTER follow_up_date;

-- 2. Bảng ICD10_DISEASES (Danh mục mã bệnh chuẩn y tế)
CREATE TABLE IF NOT EXISTS icd10_diseases (
    id CHAR(36) NOT NULL,
    code VARCHAR(20) NOT NULL,
    name_vi VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NULL,
    chapter VARCHAR(50) NULL,
    is_common BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_icd10_diseases PRIMARY KEY (id),
    CONSTRAINT uk_icd10_code UNIQUE (code),
    INDEX idx_icd10_code (code),
    INDEX idx_icd10_name (name_vi)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bảng PRESCRIPTIONS (Đơn thuốc điện tử)
CREATE TABLE IF NOT EXISTS prescriptions (
    id CHAR(36) NOT NULL,
    prescription_code VARCHAR(30) NOT NULL,
    encounter_id CHAR(36) NOT NULL,
    patient_id CHAR(36) NOT NULL,
    doctor_id CHAR(36) NOT NULL,
    diagnosis TEXT NULL,
    advice TEXT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, DISPENSED, CANCELLED
    created_by VARCHAR(50) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    CONSTRAINT pk_prescriptions PRIMARY KEY (id),
    CONSTRAINT uk_prescriptions_code UNIQUE (prescription_code),
    CONSTRAINT fk_prescriptions_encounter FOREIGN KEY (encounter_id) REFERENCES encounters (id) ON DELETE CASCADE,
    CONSTRAINT fk_prescriptions_patient FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE RESTRICT,
    CONSTRAINT fk_prescriptions_doctor FOREIGN KEY (doctor_id) REFERENCES staff_profiles (id) ON DELETE RESTRICT,
    INDEX idx_prescriptions_encounter (encounter_id),
    INDEX idx_prescriptions_patient (patient_id),
    INDEX idx_prescriptions_doctor (doctor_id),
    INDEX idx_prescriptions_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Bảng PRESCRIPTION_ITEMS (Chi tiết từng thuốc trong đơn)
CREATE TABLE IF NOT EXISTS prescription_items (
    id CHAR(36) NOT NULL,
    prescription_id CHAR(36) NOT NULL,
    medicine_id CHAR(36) NOT NULL,
    medicine_name VARCHAR(150) NOT NULL,
    unit VARCHAR(30) NOT NULL,
    quantity INT NOT NULL,
    morning_dose VARCHAR(20) NULL,
    noon_dose VARCHAR(20) NULL,
    evening_dose VARCHAR(20) NULL,
    night_dose VARCHAR(20) NULL,
    usage_timing VARCHAR(50) NULL, -- Sau ăn 30 phút, Trước ăn 30 phút, Khi đau sốt
    usage_route VARCHAR(30) NOT NULL DEFAULT 'UONG', -- UONG, TIEM, BOI, NHO
    days_count INT NULL DEFAULT 5,
    instructions TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_prescription_items PRIMARY KEY (id),
    CONSTRAINT fk_items_prescription FOREIGN KEY (prescription_id) REFERENCES prescriptions (id) ON DELETE CASCADE,
    CONSTRAINT fk_items_medicine FOREIGN KEY (medicine_id) REFERENCES medicines (id) ON DELETE RESTRICT,
    INDEX idx_items_prescription (prescription_id),
    INDEX idx_items_medicine (medicine_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Bảng SERVICE_ORDERS (Chỉ định dịch vụ kỹ thuật & cận lâm sàng)
CREATE TABLE IF NOT EXISTS service_orders (
    id CHAR(36) NOT NULL,
    order_code VARCHAR(30) NOT NULL,
    encounter_id CHAR(36) NOT NULL,
    patient_id CHAR(36) NOT NULL,
    doctor_id CHAR(36) NOT NULL,
    service_id CHAR(36) NOT NULL,
    service_name VARCHAR(150) NOT NULL,
    price DECIMAL(19,2) NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'ROUTINE', -- ROUTINE, URGENT
    notes TEXT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, PAID, PROCESSING, COMPLETED, CANCELLED
    results TEXT NULL,
    conclusion TEXT NULL,
    performed_by CHAR(36) NULL,
    performed_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_service_orders PRIMARY KEY (id),
    CONSTRAINT uk_service_orders_code UNIQUE (order_code),
    CONSTRAINT fk_orders_encounter FOREIGN KEY (encounter_id) REFERENCES encounters (id) ON DELETE CASCADE,
    CONSTRAINT fk_orders_patient FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE RESTRICT,
    CONSTRAINT fk_orders_doctor FOREIGN KEY (doctor_id) REFERENCES staff_profiles (id) ON DELETE RESTRICT,
    CONSTRAINT fk_orders_service FOREIGN KEY (service_id) REFERENCES services (id) ON DELETE RESTRICT,
    INDEX idx_orders_encounter (encounter_id),
    INDEX idx_orders_patient (patient_id),
    INDEX idx_orders_doctor (doctor_id),
    INDEX idx_orders_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Nạp Danh mục mã bệnh ICD-10 phổ biến thường gặp tại phòng khám đa khoa
-- -----------------------------------------------------------------------------
INSERT INTO icd10_diseases (id, code, name_vi, name_en, chapter, is_common) VALUES
('d0000000-0000-0000-0001-000000000001', 'I10', 'Bệnh tăng huyết áp vô căn (nguyên phát)', 'Essential (primary) hypertension', 'Tuần hoàn', TRUE),
('d0000000-0000-0000-0001-000000000002', 'E11', 'Bệnh đái tháo đường không phụ thuộc insulin (Típ 2)', 'Non-insulin-dependent diabetes mellitus', 'Nội tiết', TRUE),
('d0000000-0000-0000-0001-000000000003', 'J00', 'Viêm mũi họng cấp [cảm thường]', 'Acute nasopharyngitis [common cold]', 'Hô hấp', TRUE),
('d0000000-0000-0000-0001-000000000004', 'J02', 'Viêm họng cấp', 'Acute pharyngitis', 'Hô hấp', TRUE),
('d0000000-0000-0000-0001-000000000005', 'J06', 'Nhiễm khuẩn đường hô hấp trên cấp tính ở nhiều vị trí', 'Acute upper respiratory infections of multiple and unspecified sites', 'Hô hấp', TRUE),
('d0000000-0000-0000-0001-000000000006', 'J20', 'Viêm phế quản cấp', 'Acute bronchitis', 'Hô hấp', TRUE),
('d0000000-0000-0000-0001-000000000007', 'J45', 'Bệnh hen (suyễn)', 'Asthma', 'Hô hấp', TRUE),
('d0000000-0000-0000-0001-000000000008', 'K29.7', 'Viêm dạ dày, không xác định', 'Gastritis, unspecified', 'Tiêu hóa', TRUE),
('d0000000-0000-0000-0001-000000000009', 'K21.0', 'Bệnh trào ngược dạ dày - thực quản kèm viêm thực quản', 'Gastro-oesophageal reflux disease with oesophagitis', 'Tiêu hóa', TRUE),
('d0000000-0000-0000-0001-000000000010', 'K30', 'Chứng khó tiêu', 'Dyspepsia', 'Tiêu hóa', TRUE),
('d0000000-0000-0000-0001-000000000011', 'K59.0', 'Táo bón', 'Constipation', 'Tiêu hóa', TRUE),
('d0000000-0000-0000-0001-000000000012', 'M54.5', 'Đau lưng dưới (đau cột sống thắt lưng)', 'Low back pain', 'Cơ xương khớp', TRUE),
('d0000000-0000-0000-0001-000000000013', 'M17', 'Thoái hóa khớp gối', 'Gonarthrosis [arthrosis of knee]', 'Cơ xương khớp', TRUE),
('d0000000-0000-0000-0001-000000000014', 'G43', 'Đau nửa đầu (Migraine)', 'Migraine', 'Thần kinh', TRUE),
('d0000000-0000-0000-0001-000000000015', 'H81.0', 'Hội chứng Meniere (Rối loạn tiền đình)', 'Ménière disease', 'Thần kinh', TRUE),
('d0000000-0000-0000-0001-000000000016', 'L20', 'Viêm da dị ứng (viêm da cơ địa)', 'Atopic dermatitis', 'Da liễu', TRUE),
('d0000000-0000-0000-0001-000000000017', 'L50', 'Mày đay', 'Urticaria', 'Da liễu', TRUE),
('d0000000-0000-0000-0001-000000000018', 'B34.9', 'Nhiễm virus, không xác định (Sốt siêu vi)', 'Viral infection, unspecified', 'Truyền nhiễm', TRUE),
('d0000000-0000-0000-0001-000000000019', 'N39.0', 'Nhiễm khuẩn đường tiết niệu, vị trí không xác định', 'Urinary tract infection, site not specified', 'Tiết niệu', TRUE),
('d0000000-0000-0000-0001-000000000020', 'R50', 'Sốt không rõ nguyên nhân khác và không xác định', 'Fever of other and unknown origin', 'Triệu chứng chung', TRUE),
('d0000000-0000-0000-0001-000000000021', 'R42', 'Chóng mặt và choáng váng', 'Dizziness and giddiness', 'Triệu chứng chung', TRUE),
('d0000000-0000-0000-0001-000000000022', 'E78.0', 'Tăng cholesterol máu đơn thuần', 'Pure hypercholesterolaemia', 'Nội tiết', TRUE),
('d0000000-0000-0000-0001-000000000023', 'A09', 'Tiêu chảy và viêm dạ dày - ruột nghi do nhiễm khuẩn', 'Other gastroenteritis and colitis of infectious and unspecified origin', 'Truyền nhiễm', TRUE),
('d0000000-0000-0000-0001-000000000024', 'H10', 'Viêm kết mạc cấp (Đau mắt đỏ)', 'Conjunctivitis', 'Mắt', TRUE),
('d0000000-0000-0000-0001-000000000025', 'J01', 'Viêm xoang cấp', 'Acute sinusitis', 'Tai Mũi Họng', TRUE)
ON DUPLICATE KEY UPDATE name_vi=VALUES(name_vi);

-- -----------------------------------------------------------------------------
-- Nạp Đơn thuốc mẫu cho Lượt khám PK-20261102-001 và PK-20261102-002
-- -----------------------------------------------------------------------------
INSERT INTO prescriptions (id, prescription_code, encounter_id, patient_id, doctor_id, diagnosis, advice, status, created_by, created_at, updated_at) VALUES
('e0000000-0000-0000-0001-000000000001', 'DT-20261102-001', '00000000-0000-0000-0040-000000000001', '00000000-0000-0000-0020-000000000001', '00000000-0000-0000-0010-000000000001', 'I10 - Tăng huyết áp vô căn; Rối loạn lipid máu', 'Ăn nhạt, hạn chế muối và mỡ động vật. Đo huyết áp mỗi sáng. Tái khám đúng hẹn.', 'ACTIVE', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('e0000000-0000-0000-0001-000000000002', 'DT-20261102-002', '00000000-0000-0000-0040-000000000002', '00000000-0000-0000-0020-000000000002', '00000000-0000-0000-0010-000000000001', 'K29.7 - Viêm dạ dày tá tràng cấp', 'Ăn đúng bữa, không ăn cay nóng, không dùng rượu bia cà phê. Uống thuốc trước bữa ăn 30 phút.', 'ACTIVE', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE diagnosis=VALUES(diagnosis);

INSERT INTO prescription_items (id, prescription_id, medicine_id, medicine_name, unit, quantity, morning_dose, noon_dose, evening_dose, night_dose, usage_timing, usage_route, days_count, instructions, created_at, updated_at) VALUES
('f0000000-0000-0000-0001-000000000001', 'e0000000-0000-0000-0001-000000000001', '00000000-0000-0000-0009-000000000001', 'Panadol Extra 500mg/65mg', 'VIEN', 10, '1', '0', '1', '0', 'Sau ăn 30 phút', 'UONG', 5, 'Uống khi có triệu chứng đau đầu căng thẳng', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('f0000000-0000-0000-0001-000000000002', 'e0000000-0000-0000-0001-000000000002', '00000000-0000-0000-0009-000000000003', 'Nexium 40mg', 'VIEN', 14, '1', '0', '0', '0', 'Trước ăn sáng 30 phút', 'UONG', 14, 'Uống nguyên viên với nhiều nước, không nhai bẻ viên', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE medicine_name=VALUES(medicine_name);

-- -----------------------------------------------------------------------------
-- Nạp Chỉ định cận lâm sàng mẫu cho Lượt khám PK-20261102-001
-- -----------------------------------------------------------------------------
INSERT INTO service_orders (id, order_code, encounter_id, patient_id, doctor_id, service_id, service_name, price, priority, notes, status, results, conclusion, performed_by, performed_at, created_at, updated_at) VALUES
('a1000000-0000-0000-0001-000000000001', 'CD-20261102-001', '00000000-0000-0000-0040-000000000001', '00000000-0000-0000-0020-000000000001', '00000000-0000-0000-0010-000000000001', '00000000-0000-0000-0007-000000000003', 'Tổng Phân Tích Tế Bào Máu (CBC)', 120000.00, 'ROUTINE', 'Kiểm tra thiếu máu và chỉ số hồng cầu', 'COMPLETED', 'WBC: 6.8 K/uL, RBC: 4.6 M/uL, HGB: 13.8 g/dL, PLT: 245 K/uL. Các chỉ số trong giới hạn sinh lý bình thường.', 'Công thức máu bình thường, không thiếu máu.', '00000000-0000-0000-0010-000000000001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('a1000000-0000-0000-0001-000000000002', 'CD-20261102-002', '00000000-0000-0000-0040-000000000001', '00000000-0000-0000-0020-000000000001', '00000000-0000-0000-0010-000000000001', '00000000-0000-0000-0007-000000000005', 'Siêu Âm Doppler Màu Bụng Tổng Quát', 250000.00, 'ROUTINE', 'Khảo sát gan nhiễm mỡ, túi mật, sỏi thận', 'COMPLETED', 'Gan kích thước bình thường, nhu mô tăng hồi âm nhẹ (Gan nhiễm mỡ độ 1). Thận 2 bên không sỏi không ứ nước.', 'Gan nhiễm mỡ độ 1, các tạng khác bình thường.', '00000000-0000-0000-0010-000000000001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE service_name=VALUES(service_name);

