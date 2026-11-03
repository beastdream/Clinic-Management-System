-- =============================================================================
-- Migration V3: Khởi tạo lược đồ Quản lý Lịch hẹn & Hàng chờ Tiếp đón
-- (Appointments & Patient Queues Schema)
-- Engine: InnoDB | Charset: utf8mb4 | Collation: utf8mb4_unicode_ci
-- Khóa chính & Khóa ngoại chuẩn UUID: CHAR(36)
-- =============================================================================

-- 1. Bảng APPOINTMENTS (Lịch hẹn khám bệnh)
CREATE TABLE IF NOT EXISTS appointments (
    id CHAR(36) NOT NULL,
    appointment_code VARCHAR(30) NOT NULL,
    patient_id CHAR(36) NOT NULL,
    doctor_id CHAR(36) NULL,
    specialty_id CHAR(36) NOT NULL,
    room_id CHAR(36) NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    shift VARCHAR(20) NOT NULL DEFAULT 'MORNING', -- MORNING, AFTERNOON, EVENING
    reason TEXT NULL,
    appointment_type VARCHAR(20) NOT NULL DEFAULT 'WALK_IN', -- WALK_IN, ONLINE_PORTAL, PHONE
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, CONFIRMED, CHECKED_IN, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW
    cancellation_reason VARCHAR(255) NULL,
    created_by CHAR(36) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    CONSTRAINT pk_appointments PRIMARY KEY (id),
    CONSTRAINT uk_appointments_code UNIQUE (appointment_code),
    CONSTRAINT fk_appointments_patient FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE RESTRICT,
    CONSTRAINT fk_appointments_doctor FOREIGN KEY (doctor_id) REFERENCES staff_profiles (id) ON DELETE SET NULL,
    CONSTRAINT fk_appointments_specialty FOREIGN KEY (specialty_id) REFERENCES specialties (id) ON DELETE RESTRICT,
    CONSTRAINT fk_appointments_room FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE SET NULL,
    INDEX idx_appointments_date (appointment_date),
    INDEX idx_appointments_status (status),
    INDEX idx_appointments_patient (patient_id),
    INDEX idx_appointments_doctor (doctor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Bảng PATIENT_QUEUES (Hàng chờ điều phối tiếp đón phòng khám)
CREATE TABLE IF NOT EXISTS patient_queues (
    id CHAR(36) NOT NULL,
    clinic_id CHAR(36) NOT NULL,
    room_id CHAR(36) NOT NULL,
    appointment_id CHAR(36) NULL,
    patient_id CHAR(36) NOT NULL,
    queue_number INT NOT NULL,
    queue_date DATE NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL', -- NORMAL, EMERGENCY, ELDERLY, PREGNANT
    status VARCHAR(20) NOT NULL DEFAULT 'WAITING', -- WAITING, CALLING, IN_CONSULTATION, COMPLETED, SKIPPED
    called_at DATETIME NULL,
    completed_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_patient_queues PRIMARY KEY (id),
    CONSTRAINT uk_room_date_number UNIQUE (room_id, queue_date, queue_number),
    CONSTRAINT fk_queues_clinic FOREIGN KEY (clinic_id) REFERENCES clinics (id) ON DELETE RESTRICT,
    CONSTRAINT fk_queues_room FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE RESTRICT,
    CONSTRAINT fk_queues_appointment FOREIGN KEY (appointment_id) REFERENCES appointments (id) ON DELETE SET NULL,
    CONSTRAINT fk_queues_patient FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE RESTRICT,
    INDEX idx_queues_date (queue_date),
    INDEX idx_queues_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

