-- ==============================================================================
-- PHÒNG KHÁM ĐA KHOA QUỐC TẾ - CLINIC MANAGEMENT SYSTEM
-- SCRIPT KIỂM THỬ VÀ XÁC MINH CƠ SỞ DỮ LIỆU MYSQL 8.4 LTS
-- File: docs/VERIFY_DATABASE.sql
-- ==============================================================================

USE `clinic_management`;

-- ------------------------------------------------------------------------------
-- 1. KIỂM TRA LỊCH SỬ MIGRATION FLYWAY (SCHEMA VERSION & CHECKSUM)
-- ------------------------------------------------------------------------------
SELECT 
    `installed_rank` AS 'Thứ tự',
    `version` AS 'Phiên bản',
    `description` AS 'Mô tả Migration',
    `type` AS 'Loại',
    `script` AS 'File Script',
    `installed_on` AS 'Thời gian cài đặt',
    `execution_time` AS 'Thời gian chạy (ms)',
    `success` AS 'Thành công (1=True)'
FROM `flyway_schema_history`
ORDER BY `installed_rank` ASC;

-- ------------------------------------------------------------------------------
-- 2. TỔNG HỢP SỐ LƯỢNG BẢN GHI TRÊN CÁC BẢNG CỐT LÕI
-- ------------------------------------------------------------------------------
SELECT 'users' AS 'Tên bảng', COUNT(*) AS 'Tổng số bản ghi' FROM `users`
UNION ALL
SELECT 'roles', COUNT(*) FROM `roles`
UNION ALL
SELECT 'user_roles', COUNT(*) FROM `user_roles`
UNION ALL
SELECT 'permissions', COUNT(*) FROM `permissions`
UNION ALL
SELECT 'role_permissions', COUNT(*) FROM `role_permissions`
UNION ALL
SELECT 'staff_profiles', COUNT(*) FROM `staff_profiles`
UNION ALL
SELECT 'specialties', COUNT(*) FROM `specialties`
UNION ALL
SELECT 'staff_specialties', COUNT(*) FROM `staff_specialties`
UNION ALL
SELECT 'rooms', COUNT(*) FROM `rooms`
UNION ALL
SELECT 'patients', COUNT(*) FROM `patients`
UNION ALL
SELECT 'patient_user_links', COUNT(*) FROM `patient_user_links`
UNION ALL
SELECT 'appointments', COUNT(*) FROM `appointments`
UNION ALL
SELECT 'patient_queues', COUNT(*) FROM `patient_queues`
UNION ALL
SELECT 'medicines', COUNT(*) FROM `medicines`
UNION ALL
SELECT 'service_items', COUNT(*) FROM `service_items`;

-- ------------------------------------------------------------------------------
-- 3. KIỂM TRA QUAN HỆ: BỆNH NHÂN VÀ LỊCH HẸN KHÁM
-- ------------------------------------------------------------------------------
SELECT 
    a.appointment_code AS 'Mã lịch hẹn',
    p.patient_code AS 'Mã bệnh nhân',
    p.full_name AS 'Họ tên bệnh nhân',
    p.phone AS 'SĐT bệnh nhân',
    s.name AS 'Chuyên khoa khám',
    COALESCE(st.full_name, 'Chưa chỉ định') AS 'Bác sĩ phụ trách',
    r.name AS 'Phòng khám',
    a.appointment_date AS 'Ngày khám',
    a.appointment_time AS 'Giờ khám',
    a.shift AS 'Ca khám',
    a.status AS 'Trạng thái lịch hẹn',
    a.appointment_type AS 'Loại hẹn'
FROM `appointments` a
JOIN `patients` p ON a.patient_id = p.id
JOIN `specialties` s ON a.specialty_id = s.id
LEFT JOIN `staff_profiles` st ON a.doctor_id = st.id
LEFT JOIN `rooms` r ON a.room_id = r.id
ORDER BY a.appointment_date DESC, a.appointment_time DESC
LIMIT 15;

-- ------------------------------------------------------------------------------
-- 4. THỐNG KÊ LỊCH HẸN THEO TRẠNG THÁI (STATUS DISTRIBUTION)
-- ------------------------------------------------------------------------------
SELECT 
    `status` AS 'Trạng thái',
    COUNT(*) AS 'Số lượng',
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM `appointments`), 1) AS 'Tỷ lệ (%)'
FROM `appointments`
GROUP BY `status`
ORDER BY `Số lượng` DESC;

-- ------------------------------------------------------------------------------
-- 5. KIỂM TRA QUAN HỆ: BÁC SĨ VÀ CHUYÊN KHOA PHỤ TRÁCH
-- ------------------------------------------------------------------------------
SELECT 
    st.staff_code AS 'Mã nhân viên',
    st.full_name AS 'Họ tên bác sĩ',
    st.qualification AS 'Trình độ chuyên môn',
    st.phone AS 'Điện thoại',
    s.code AS 'Mã chuyên khoa',
    s.name AS 'Tên chuyên khoa',
    r.name AS 'Phòng làm việc',
    ss.is_primary AS 'Chuyên khoa chính'
FROM `staff_profiles` st
JOIN `staff_specialties` ss ON st.id = ss.staff_id
JOIN `specialties` s ON ss.specialty_id = s.id
LEFT JOIN `rooms` r ON st.room_id = r.id
WHERE st.position = 'DOCTOR'
ORDER BY st.staff_code ASC;

-- ------------------------------------------------------------------------------
-- 6. KIỂM TRA QUAN HỆ: TÀI KHOẢN VÀ VAI TRÒ (RBAC USERS & ROLES)
-- ------------------------------------------------------------------------------
SELECT 
    u.username AS 'Tên đăng nhập',
    u.email AS 'Email',
    u.status AS 'Trạng thái TK',
    r.code AS 'Mã vai trò',
    r.name AS 'Tên vai trò',
    COALESCE(st.full_name, p.full_name, 'Hệ thống') AS 'Người sở hữu'
FROM `users` u
JOIN `user_roles` ur ON u.id = ur.user_id
JOIN `roles` r ON ur.role_id = r.id
LEFT JOIN `staff_profiles` st ON st.user_id = u.id
LEFT JOIN `patient_user_links` pul ON pul.user_id = u.id
LEFT JOIN `patients` p ON pul.patient_id = p.id
ORDER BY u.created_at ASC;

-- ------------------------------------------------------------------------------
-- 7. KIỂM TRA DANH MỤC THUỐC VÀ TỒN KHO AN TOÀN
-- ------------------------------------------------------------------------------
SELECT 
    m.code AS 'Mã thuốc',
    m.name AS 'Tên biệt dược',
    m.generic_name AS 'Hoạt chất chính',
    m.category AS 'Nhóm dược lý',
    m.unit AS 'Đơn vị tính',
    m.unit_price AS 'Đơn giá (VNĐ)',
    m.current_stock AS 'Tồn kho hiện tại',
    m.min_stock_alert AS 'Cảnh báo mức tối thiểu',
    CASE 
        WHEN m.current_stock <= m.min_stock_alert THEN '⚠️ CẦN NHẬP KHO'
        ELSE '✅ TỒN AN TOÀN'
    END AS 'Trạng thái kho',
    CASE 
        WHEN m.prescription_required = 1 THEN 'Bắt buộc kê đơn'
        ELSE 'Thuốc không kê đơn'
    END AS 'Phân loại kê đơn'
FROM `medicines` m
ORDER BY m.code ASC;

-- ------------------------------------------------------------------------------
-- 8. KIỂM TRA HÀNG CHỜ TIẾP ĐÓN TRONG NGÀY (TODAY QUEUE)
-- ------------------------------------------------------------------------------
SELECT 
    pq.queue_number AS 'Số thứ tự',
    pq.queue_code AS 'Mã tiếp đón',
    p.patient_code AS 'Mã bệnh nhân',
    p.full_name AS 'Họ tên',
    pq.queue_type AS 'Phân luồng',
    pq.priority_level AS 'Mức ưu tiên (0=Thường, 1=Ưu tiên)',
    r.name AS 'Phòng khám chỉ định',
    pq.status AS 'Trạng thái chờ',
    pq.estimated_time AS 'Giờ hẹn dự kiến'
FROM `patient_queues` pq
JOIN `patients` p ON pq.patient_id = p.id
LEFT JOIN `rooms` r ON pq.room_id = r.id
ORDER BY pq.queue_number ASC;

-- ------------------------------------------------------------------------------
-- 9. KIỂM TRA RÀNG BUỘC KHÓA NGOẠI KHÔNG BỊ MỒ CÔI (ORPHAN RECORDS CHECK)
-- Kết quả trả về PHẢI là 0 cho tất cả các kiểm tra bên dưới.
-- ------------------------------------------------------------------------------
SELECT 
    'Lịch hẹn có patient_id không hợp lệ' AS 'Loại kiểm tra',
    COUNT(*) AS 'Số lỗi vi phạm'
FROM `appointments` a
LEFT JOIN `patients` p ON a.patient_id = p.id
WHERE p.id IS NULL
UNION ALL
SELECT 
    'Lịch hẹn có specialty_id không hợp lệ',
    COUNT(*)
FROM `appointments` a
LEFT JOIN `specialties` s ON a.specialty_id = s.id
WHERE s.id IS NULL
UNION ALL
SELECT 
    'Hàng chờ có patient_id không hợp lệ',
    COUNT(*)
FROM `patient_queues` pq
LEFT JOIN `patients` p ON pq.patient_id = p.id
WHERE p.id IS NULL;

