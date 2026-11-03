-- =============================================================================
-- Migration V5: Khởi tạo bảng Lượt khám bệnh lâm sàng (Clinical Encounters)
-- Engine: InnoDB | Charset: utf8mb4 | Collation: utf8mb4_unicode_ci
-- Khóa chính UUID CHAR(36), tuân thủ No Hard Delete và Clinical Privacy
-- =============================================================================

CREATE TABLE IF NOT EXISTS encounters (
    id CHAR(36) NOT NULL,
    encounter_code VARCHAR(30) NOT NULL,
    appointment_id CHAR(36) NULL,
    patient_id CHAR(36) NOT NULL,
    doctor_id CHAR(36) NOT NULL,
    room_id CHAR(36) NULL,
    encounter_date_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    chief_complaint TEXT NOT NULL,
    examination_notes TEXT NULL,
    diagnosis TEXT NOT NULL,
    treatment_plan TEXT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS', -- IN_PROGRESS, COMPLETED, CANCELLED

    -- Chỉ số sinh hiệu lâm sàng (Vital Signs - MVP)
    temperature DECIMAL(4, 1) NULL,         -- Thân nhiệt (°C)
    blood_pressure VARCHAR(20) NULL,        -- Huyết áp (mmHg, ví dụ: 120/80)
    heart_rate INT NULL,                    -- Mạch / Nhịp tim (nhịp/phút)
    respiratory_rate INT NULL,              -- Nhịp thở (lần/phút)
    weight DECIMAL(5, 2) NULL,              -- Cân nặng (kg)
    height DECIMAL(5, 2) NULL,              -- Chiều cao (cm)

    created_by CHAR(36) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,

    CONSTRAINT pk_encounters PRIMARY KEY (id),
    CONSTRAINT uk_encounters_code UNIQUE (encounter_code),
    CONSTRAINT fk_encounters_appointment FOREIGN KEY (appointment_id) REFERENCES appointments (id) ON DELETE SET NULL,
    CONSTRAINT fk_encounters_patient FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE RESTRICT,
    CONSTRAINT fk_encounters_doctor FOREIGN KEY (doctor_id) REFERENCES staff_profiles (id) ON DELETE RESTRICT,
    CONSTRAINT fk_encounters_room FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE SET NULL,
    INDEX idx_encounters_doctor (doctor_id),
    INDEX idx_encounters_patient (patient_id),
    INDEX idx_encounters_appointment (appointment_id),
    INDEX idx_encounters_status (status),
    INDEX idx_encounters_date_time (encounter_date_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Dữ liệu mẫu mồi sẵn (Demo Encounters)
-- -----------------------------------------------------------------------------
INSERT INTO encounters (
    id, encounter_code, appointment_id, patient_id, doctor_id, room_id,
    encounter_date_time, chief_complaint, examination_notes, diagnosis, treatment_plan,
    status, temperature, blood_pressure, heart_rate, respiratory_rate, weight, height,
    created_by, created_at, updated_at
) VALUES
(
    '00000000-0000-0000-0040-000000000001',
    'PK-20261102-001',
    '00000000-0000-0000-0030-000000000001',
    '00000000-0000-0000-0020-000000000001',
    '00000000-0000-0000-0010-000000000001',
    '00000000-0000-0000-0006-000000000003',
    DATE_SUB(NOW(), INTERVAL 1 DAY),
    'Khám định kỳ tăng huyết áp, thỉnh thoảng tức ngực nhẹ khi vận động nhanh',
    'Bệnh nhân tỉnh, tiếp xúc tốt. Tim đều, T1 T2 rõ, không nghe âm thổi bệnh lý. Phổi rì rào phế nang êm dịu, không rale. Bụng mềm, gan lách không to.',
    'Tăng huyết áp vô căn (nguyên phát) - Độ 2 theo ISH / JNC 8',
    '1. Duy trì dùng thuốc Amlodipine 5mg (1 viên uống sáng sau ăn)\n2. Giảm muối trong khẩu phần (<5g muối/ngày), kiêng rượu bia, cà phê đậm\n3. Đo huyết áp tại nhà 2 lần/ngày (sáng, tối) và ghi nhật ký\n4. Tái khám sau 4 tuần hoặc ngay khi huyết áp > 160/100 mmHg',
    'COMPLETED',
    36.7,
    '138/86',
    76,
    18,
    68.5,
    168.0,
    '00000000-0000-0000-0000-000000000011',
    DATE_SUB(NOW(), INTERVAL 1 DAY),
    DATE_SUB(NOW(), INTERVAL 1 DAY)
),
(
    '00000000-0000-0000-0040-000000000002',
    'PK-20261102-002',
    '00000000-0000-0000-0030-000000000002',
    '00000000-0000-0000-0020-000000000002',
    '00000000-0000-0000-0010-000000000001',
    '00000000-0000-0000-0006-000000000003',
    DATE_SUB(NOW(), INTERVAL 1 DAY),
    'Đau âm ỉ vùng thượng vị kèm ợ chua, buồn nôn nhẹ sau khi ăn no',
    'Ấn đau nhẹ vùng thượng vị, không có phản ứng thành bụng, đề kháng âm tính. Bụng mềm, nhu động ruột bình thường.',
    'Viêm dạ dày - tá tràng cấp tính, trào ngược dạ dày thực quản (GERD)',
    '1. Esomeprazole 40mg: Uống 1 viên trước ăn sáng 30 phút\n2. Phosphalugel: Uống 1 gói khi có cơn đau hoặc ợ chua\n3. Tránh thức ăn cay chua, đồ chiên rán nhiều dầu mỡ\n4. Không ăn no trước khi đi ngủ ít nhất 2 giờ, kê cao đầu giường\n5. Tái khám sau 2 tuần',
    'COMPLETED',
    37.0,
    '122/78',
    82,
    19,
    54.0,
    160.0,
    '00000000-0000-0000-0000-000000000011',
    DATE_SUB(NOW(), INTERVAL 1 DAY),
    DATE_SUB(NOW(), INTERVAL 1 DAY)
)
ON DUPLICATE KEY UPDATE 
    diagnosis = VALUES(diagnosis),
    treatment_plan = VALUES(treatment_plan);

