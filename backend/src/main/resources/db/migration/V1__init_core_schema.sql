-- =============================================================================
-- Migration V1: Khởi tạo lược đồ nền tảng Core Schema (MySQL 8.4 LTS / InnoDB)
-- Chuẩn UUID: CHAR(36)
-- Tiền tệ: DECIMAL(19,2)
-- Bộ mã ký tự: utf8mb4 / utf8mb4_unicode_ci
-- =============================================================================

-- 1. Bảng USERS
CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) NOT NULL,
    username VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) NULL,
    phone VARCHAR(20) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    failed_login_attempts INT NOT NULL DEFAULT 0,
    locked_until DATETIME NULL,
    is_staff BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uk_users_username UNIQUE (username),
    CONSTRAINT uk_users_email UNIQUE (email),
    INDEX idx_users_status (status),
    INDEX idx_users_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Bảng ROLES
CREATE TABLE IF NOT EXISTS roles (
    id CHAR(36) NOT NULL,
    code VARCHAR(30) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255) NULL,
    is_system BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_roles PRIMARY KEY (id),
    CONSTRAINT uk_roles_code UNIQUE (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bảng PERMISSIONS
CREATE TABLE IF NOT EXISTS permissions (
    id CHAR(36) NOT NULL,
    code VARCHAR(60) NOT NULL,
    name VARCHAR(100) NOT NULL,
    module VARCHAR(50) NOT NULL,
    description VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_permissions PRIMARY KEY (id),
    CONSTRAINT uk_permissions_code UNIQUE (code),
    INDEX idx_permissions_module (module)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Bảng USER_ROLES
CREATE TABLE IF NOT EXISTS user_roles (
    user_id CHAR(36) NOT NULL,
    role_id CHAR(36) NOT NULL,
    CONSTRAINT pk_user_roles PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Bảng ROLE_PERMISSIONS
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id CHAR(36) NOT NULL,
    permission_id CHAR(36) NOT NULL,
    CONSTRAINT pk_role_permissions PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE,
    CONSTRAINT fk_role_permissions_perm FOREIGN KEY (permission_id) REFERENCES permissions (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Bảng CLINICS (Cơ sở phòng khám)
CREATE TABLE IF NOT EXISTS clinics (
    id CHAR(36) NOT NULL,
    code VARCHAR(30) NOT NULL,
    name VARCHAR(150) NOT NULL,
    address VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_clinics PRIMARY KEY (id),
    CONSTRAINT uk_clinics_code UNIQUE (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Bảng BRANCHES (Chi nhánh phòng khám)
CREATE TABLE IF NOT EXISTS branches (
    id CHAR(36) NOT NULL,
    clinic_id CHAR(36) NOT NULL,
    code VARCHAR(30) NOT NULL,
    name VARCHAR(150) NOT NULL,
    address VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_branches PRIMARY KEY (id),
    CONSTRAINT uk_branches_code UNIQUE (code),
    CONSTRAINT fk_branches_clinic FOREIGN KEY (clinic_id) REFERENCES clinics (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Bảng SPECIALTIES (Chuyên khoa khám)
CREATE TABLE IF NOT EXISTS specialties (
    id CHAR(36) NOT NULL,
    code VARCHAR(30) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_specialties PRIMARY KEY (id),
    CONSTRAINT uk_specialties_code UNIQUE (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Bảng ROOMS (Phòng chức năng / Phòng khám)
CREATE TABLE IF NOT EXISTS rooms (
    id CHAR(36) NOT NULL,
    clinic_id CHAR(36) NOT NULL,
    branch_id CHAR(36) NULL,
    specialty_id CHAR(36) NULL,
    code VARCHAR(30) NOT NULL,
    name VARCHAR(100) NOT NULL,
    room_type VARCHAR(30) NOT NULL, -- EXAM, LAB, RADIOLOGY, PHARMACY, RECEPTION, CASHIER
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_rooms PRIMARY KEY (id),
    CONSTRAINT uk_rooms_code UNIQUE (code),
    CONSTRAINT fk_rooms_clinic FOREIGN KEY (clinic_id) REFERENCES clinics (id) ON DELETE RESTRICT,
    CONSTRAINT fk_rooms_branch FOREIGN KEY (branch_id) REFERENCES branches (id) ON DELETE SET NULL,
    CONSTRAINT fk_rooms_specialty FOREIGN KEY (specialty_id) REFERENCES specialties (id) ON DELETE SET NULL,
    INDEX idx_rooms_type (room_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Bảng STAFF_PROFILES (Hồ sơ nhân viên & Bác sĩ)
CREATE TABLE IF NOT EXISTS staff_profiles (
    id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    staff_code VARCHAR(30) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    gender VARCHAR(10) NOT NULL, -- MALE, FEMALE, OTHER
    date_of_birth DATE NULL,
    phone VARCHAR(20) NOT NULL,
    specialty_id CHAR(36) NULL,
    room_id CHAR(36) NULL,
    license_number VARCHAR(50) NULL,
    qualification VARCHAR(100) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, ON_LEAVE, TERMINATED
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_staff_profiles PRIMARY KEY (id),
    CONSTRAINT uk_staff_user UNIQUE (user_id),
    CONSTRAINT uk_staff_code UNIQUE (staff_code),
    CONSTRAINT fk_staff_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT fk_staff_specialty FOREIGN KEY (specialty_id) REFERENCES specialties (id) ON DELETE SET NULL,
    CONSTRAINT fk_staff_room FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE SET NULL,
    INDEX idx_staff_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Bảng DOCTOR_SPECIALTIES (Chuyên khoa mở rộng của Bác sĩ)
CREATE TABLE IF NOT EXISTS doctor_specialties (
    doctor_id CHAR(36) NOT NULL,
    specialty_id CHAR(36) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT pk_doctor_specialties PRIMARY KEY (doctor_id, specialty_id),
    CONSTRAINT fk_doc_spec_doctor FOREIGN KEY (doctor_id) REFERENCES staff_profiles (id) ON DELETE CASCADE,
    CONSTRAINT fk_doc_spec_specialty FOREIGN KEY (specialty_id) REFERENCES specialties (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Bảng STAFF_SCHEDULES (Lịch làm việc ca trực của nhân viên / bác sĩ)
CREATE TABLE IF NOT EXISTS staff_schedules (
    id CHAR(36) NOT NULL,
    staff_id CHAR(36) NOT NULL,
    room_id CHAR(36) NOT NULL,
    work_date DATE NOT NULL,
    shift VARCHAR(20) NOT NULL, -- MORNING, AFTERNOON, EVENING, FULL_DAY
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_patients INT NOT NULL DEFAULT 30,
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE, FULL, OFF
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_staff_schedules PRIMARY KEY (id),
    CONSTRAINT fk_schedules_staff FOREIGN KEY (staff_id) REFERENCES staff_profiles (id) ON DELETE RESTRICT,
    CONSTRAINT fk_schedules_room FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE RESTRICT,
    INDEX idx_schedules_work (staff_id, work_date),
    INDEX idx_schedules_room_date (room_id, work_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Bảng PATIENTS (Hồ sơ bệnh nhân độc lập với User account)
CREATE TABLE IF NOT EXISTS patients (
    id CHAR(36) NOT NULL,
    patient_code VARCHAR(30) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) NOT NULL, -- MALE, FEMALE, OTHER
    phone VARCHAR(20) NOT NULL,
    identity_card_no VARCHAR(25) NULL,
    email VARCHAR(100) NULL,
    address VARCHAR(255) NULL,
    emergency_contact_name VARCHAR(100) NULL,
    emergency_contact_phone VARCHAR(20) NULL,
    blood_type VARCHAR(10) NULL,
    allergies TEXT NULL,
    medical_history_summary TEXT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, DECEASED, ARCHIVED
    created_by VARCHAR(36) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    CONSTRAINT pk_patients PRIMARY KEY (id),
    CONSTRAINT uk_patients_code UNIQUE (patient_code),
    INDEX idx_patients_name (full_name),
    INDEX idx_patients_phone (phone),
    INDEX idx_patients_cccd (identity_card_no),
    INDEX idx_patients_dob (date_of_birth),
    INDEX idx_patients_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Bảng PATIENT_USER_LINKS (Liên kết Hồ sơ Bệnh nhân với Tài khoản Cổng thông tin)
CREATE TABLE IF NOT EXISTS patient_user_links (
    id CHAR(36) NOT NULL,
    patient_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    linked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_patient_user_links PRIMARY KEY (id),
    CONSTRAINT uk_link_patient UNIQUE (patient_id),
    CONSTRAINT uk_link_user UNIQUE (user_id),
    CONSTRAINT fk_link_patient FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE RESTRICT,
    CONSTRAINT fk_link_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Bảng SERVICES (Danh mục dịch vụ y tế)
CREATE TABLE IF NOT EXISTS services (
    id CHAR(36) NOT NULL,
    code VARCHAR(30) NOT NULL,
    name VARCHAR(150) NOT NULL,
    specialty_id CHAR(36) NULL,
    service_type VARCHAR(30) NOT NULL, -- EXAM, LAB, RADIOLOGY, PROCEDURE
    description TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_services PRIMARY KEY (id),
    CONSTRAINT uk_services_code UNIQUE (code),
    CONSTRAINT fk_services_specialty FOREIGN KEY (specialty_id) REFERENCES specialties (id) ON DELETE SET NULL,
    INDEX idx_services_type (service_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Bảng SERVICE_PRICES (Bảng giá dịch vụ và lịch sử giá)
CREATE TABLE IF NOT EXISTS service_prices (
    id CHAR(36) NOT NULL,
    service_id CHAR(36) NOT NULL,
    price DECIMAL(19,2) NOT NULL,
    effective_from DATETIME NOT NULL,
    effective_to DATETIME NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    notes VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_service_prices PRIMARY KEY (id),
    CONSTRAINT fk_prices_service FOREIGN KEY (service_id) REFERENCES services (id) ON DELETE CASCADE,
    INDEX idx_prices_service_date (service_id, effective_from, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. Bảng MEDICINES (Danh mục dược phẩm cơ bản)
CREATE TABLE IF NOT EXISTS medicines (
    id CHAR(36) NOT NULL,
    code VARCHAR(30) NOT NULL,
    name VARCHAR(150) NOT NULL,
    generic_name VARCHAR(150) NOT NULL,
    registration_number VARCHAR(50) NULL,
    unit VARCHAR(30) NOT NULL, -- VIEN, VI, HOP, LO, GOI, ONG
    unit_price DECIMAL(19,2) NOT NULL DEFAULT 0.00,
    current_stock DECIMAL(12,3) NOT NULL DEFAULT 0.000,
    min_stock_alert DECIMAL(12,3) NOT NULL DEFAULT 50.000,
    is_prescription_required BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_medicines PRIMARY KEY (id),
    CONSTRAINT uk_medicines_code UNIQUE (code),
    INDEX idx_medicines_name (name),
    INDEX idx_medicines_generic (generic_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. Bảng AUDIT_LOGS (Nhật ký kiểm toán hệ thống)
CREATE TABLE IF NOT EXISTS audit_logs (
    id CHAR(36) NOT NULL,
    user_id CHAR(36) NULL,
    username VARCHAR(50) NOT NULL,
    role_name VARCHAR(50) NOT NULL,
    action VARCHAR(30) NOT NULL, -- CREATE, UPDATE, DELETE, ACCESS, LOGIN, LOGOUT, EXPORT
    entity_name VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50) NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_audit_logs PRIMARY KEY (id),
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_action (action),
    INDEX idx_audit_entity (entity_name, entity_id),
    INDEX idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
