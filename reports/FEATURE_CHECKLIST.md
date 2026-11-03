# BẢNG THEO DÕI TÍNH NĂNG DỰ ÁN (FEATURE_CHECKLIST.MD)

> **Dự án**: Clinic Management System  
> **Trạng thái quy chuẩn**: `NOT STARTED`, `IN PROGRESS`, `COMPLETE`, `BLOCKED`  
> **Cập nhật lần cuối**: Phase 01 Completion (2026-10-16)

---

## 1. PHASE 00: PHÂN TÍCH HỆ THỐNG VÀ THIẾT KẾ KIẾN TRÚC

| STT | Hạng mục / Tính năng | Mô tả chi tiết | Trạng thái |
| :---: | :--- | :--- | :---: |
| 1.1 | Kiểm tra Workspace & Thiết lập Quy chuẩn | Khởi tạo tài liệu quy tắc phát triển `AGENTS.md` | `COMPLETE` |
| 1.2 | Thiết kế Kiến trúc Hệ thống | Hoàn thiện `docs/architecture.md` (Modular Monolith, Decoupling, Security) | `COMPLETE` |
| 1.3 | Thiết kế Cơ sở Dữ liệu Tổng thể | Hoàn thiện `docs/erd.md` (Mermaid ERD, Schemas, Constraints, Indexes) | `COMPLETE` |
| 1.4 | Ma trận Phân quyền & Kiểm soát Truy cập | Hoàn thiện `docs/rbac-matrix.md` (6 roles, SoD, Data Ownership, Admin restriction) | `COMPLETE` |
| 1.5 | Đặc tả Chu trình & Máy Trạng thái | Hoàn thiện `docs/workflows.md` (Appointment, Encounter, Rx, Invoice, Payment, FEFO) | `COMPLETE` |
| 1.6 | Đặc tả Danh mục Use Case | Hoàn thiện `docs/use-cases.md` (Use case tổng & Use case chi tiết 6 vai trò) | `COMPLETE` |
| 1.7 | Kế hoạch & Danh mục Thiết kế REST API | Hoàn thiện `docs/api-plan.md` (Endpoint catalog, Response envelope, Error spec) | `COMPLETE` |
| 1.8 | Kế hoạch Triển khai theo Giai đoạn | Hoàn thiện `docs/development-plan.md` (Lộ trình 8 phase, Deliverables, DoD) | `COMPLETE` |
| 1.9 | Chiến lược Kiểm thử Chất lượng | Hoàn thiện `docs/testing-strategy.md` (Unit, Integration, Security, FEFO test) | `COMPLETE` |
| 1.10| Thiết lập Feature Checklist Báo cáo | Khởi tạo bảng theo dõi tiến độ `reports/FEATURE_CHECKLIST.md` | `COMPLETE` |

---

## 2. PHASE 01: KHUNG NỀN TẢNG, BẢO MẬT & DANH MỤC DÙNG CHUNG (CORE & MASTER DATA)

| STT | Hạng mục / Tính năng | Vai trò liên quan | Trạng thái |
| :---: | :--- | :--- | :---: |
| 2.1 | Khởi tạo Spring Boot 3.x (Java 21) & Maven | Developer | `COMPLETE` |
| 2.2 | Cấu hình MySQL 8.4 LTS & Flyway Migration | Developer | `COMPLETE` |
| 2.3 | Flyway Migration `V1__init_core_schema.sql` (18 bảng) & `V2__seed_initial_data.sql` | Developer | `COMPLETE` |
| 2.4 | Spring Security 6, JWT Filter, Refresh Token | Tất cả | `COMPLETE` |
| 2.5 | Cơ chế Khóa tài khoản sau 5 lần sai mật khẩu | ADMIN | `COMPLETE` |
| 2.6 | Quản lý Tài khoản Người dùng & Nhân viên (`staff_profiles`) | ADMIN | `COMPLETE` |
| 2.7 | Quản lý Danh mục Cơ sở, Chuyên khoa, Phòng ốc | ADMIN | `COMPLETE` |
| 2.8 | Quản lý Danh mục Dịch vụ Kỹ thuật & Bảng giá (`service_prices`)| ADMIN | `COMPLETE` |
| 2.9 | Khởi tạo React + TypeScript + Vite + Tailwind + shadcn/ui | Developer | `COMPLETE` |
| 2.10| Auth Layout, Dashboard Layout, Sidebar theo Role | Tất cả | `COMPLETE` |

---

## 3. PHASE 02: QUẢN LÝ BỆNH NHÂN, LỊCH HẸN & TIẾP ĐÓN HÀNG CHỜ

| STT | Hạng mục / Tính năng | Vai trò liên quan | Trạng thái |
| :---: | :--- | :--- | :---: |
| 3.1 | Flyway Migration `V3__init_patient_appointment_queue.sql` & `V4__seed_comprehensive_demo_data.sql` | Developer | `COMPLETE` |
| 3.2 | Quản lý Hồ sơ Bệnh nhân (Tìm kiếm CCCD/SĐT, Sinh mã `BN-XXX`)| RECEPTIONIST, DOCTOR | `COMPLETE` |
| 3.3 | Quản lý Bác sĩ & Chuyên khoa (`/doctors`) | ADMIN, RECEPTIONIST | `COMPLETE` |
| 3.4 | Đặt lịch hẹn Khám bệnh (Tại quầy / Qua điện thoại / Lọc chuyên khoa) | RECEPTIONIST, PATIENT | `COMPLETE` |
| 3.5 | Tiếp đón & Check-in Bệnh nhân tại quầy | RECEPTIONIST | `COMPLETE` |
| 3.6 | Điều phối Hàng chờ Phòng khám (Cấp STT, Hàng chờ tiếp đón) | RECEPTIONIST, DOCTOR | `COMPLETE` |
| 3.7 | Xử lý Hủy lịch hẹn & Đổi trạng thái lịch hẹn | RECEPTIONIST, SYSTEM | `COMPLETE` |

---

## 4. PHASE 03: KHÁM LÂM SÀNG, BỆNH ÁN ĐIỆN TỬ & KÊ ĐƠN THUỐC

| STT | Hạng mục / Tính năng | Vai trò liên quan | Trạng thái |
| :---: | :--- | :--- | :---: |
| 4.1 | Flyway Migration `V5__init_clinical_encounters.sql` | Developer | `COMPLETE` |
| 4.2 | Bắt đầu Lượt khám (`Encounter: IN_PROGRESS`) từ Hàng chờ tiếp đón | DOCTOR | `COMPLETE` |
| 4.3 | Đo đạc & Ghi nhận Chỉ số Sinh hiệu (Vitals, BMI tự động tính) | DOCTOR, RECEPTIONIST | `COMPLETE` |
| 4.4 | Khám lâm sàng & Chẩn đoán Mã bệnh chuẩn **ICD-10** | DOCTOR | `COMPLETE` |
| 4.5 | Chỉ định điều trị, ghi chú thăm khám & hướng xử trí | DOCTOR | `COMPLETE` |
| 4.6 | Hoàn thành Lượt khám & Khóa bệnh án chống chỉnh sửa bất hợp pháp| DOCTOR | `COMPLETE` |
| 4.7 | Rào cản Bảo mật: Chặn Admin đọc Bệnh án lâm sàng | ADMIN, DOCTOR | `COMPLETE` |

---

## 5. PHASE 04: DƯỢC PHẨM, NHẬP KHO THEO LÔ (BATCH/HSD) & CẤP PHÁT FEFO

| STT | Hạng mục / Tính năng | Vai trò liên quan | Trạng thái |
| :---: | :--- | :--- | :---: |
| 5.1 | Flyway Migration `V4__init_pharmacy_inventory.sql` | Developer | `NOT STARTED` |
| 5.2 | Quản lý Danh mục Biệt dược, Hoạt chất, Quy cách đóng gói | PHARMACIST | `NOT STARTED` |
| 5.3 | Quản lý Nhà cung cấp Dược phẩm | PHARMACIST | `NOT STARTED` |
| 5.4 | Nhập kho Dược phẩm theo Đơn mua (Số Lô, Hạn sử dụng, Giá vốn) | PHARMACIST | `NOT STARTED` |
| 5.5 | Cơ chế Khóa bi quan (`Pessimistic Lock`) chống Race Condition kho | PHARMACIST | `NOT STARTED` |
| 5.6 | Thuật toán Xuất kho Cấp phát Thuốc theo Đơn tự động **FEFO** | PHARMACIST | `NOT STARTED` |
| 5.7 | Cảnh báo Thuốc sắp hết hạn (<= 90 ngày) & Dưới tồn tối thiểu | PHARMACIST | `NOT STARTED` |
| 5.8 | Điều chỉnh Kiểm kê Tồn kho Thủ công & Ghi nhận Audit Log | PHARMACIST, ADMIN | `NOT STARTED` |

---

## 6. PHASE 05: VIỆN PHÍ, HÓA ĐƠN & GIAO DỊCH THANH TOÁN

| STT | Hạng mục / Tính năng | Vai trò liên quan | Trạng thái |
| :---: | :--- | :--- | :---: |
| 6.1 | Flyway Migration `V6__init_billing_invoices.sql` & `V7__add_updated_at_to_payments.sql` | Developer | `COMPLETE` |
| 6.2 | Tự động Tính toán Viện phí trên Backend (Server-side calculation, `DECIMAL(15, 2)` / `BigDecimal`) | SYSTEM, CASHIER | `COMPLETE` |
| 6.3 | Thu tiền Đa phương thức (Tiền mặt `CASH`, QR Chuyển khoản `BANK_TRANSFER`) | CASHIER | `COMPLETE` |
| 6.4 | Cơ chế Chống thanh toán trùng & Chặn thanh toán hóa đơn hủy | CASHIER | `COMPLETE` |
| 6.5 | Phân loại trạng thái Hóa đơn (`UNPAID`, `PAID`, `CANCELLED`) & Hủy hóa đơn lưu vết | CASHIER, ADMIN | `COMPLETE` |
| 6.6 | Xem Chi tiết & In Phiếu Hóa đơn viện phí chuẩn y tế (`window.print()`) | CASHIER, PATIENT | `COMPLETE` |
| 6.7 | Báo cáo Doanh thu Viện phí thực thu (Loại trừ triệt để hóa đơn đã hủy) | CASHIER, ADMIN | `COMPLETE` |
| 6.8 | Giao diện Quản lý Viện phí React TypeScript (`/billing`) & Phân trang, Lọc theo ngày | CASHIER, RECEPTIONIST, ADMIN | `COMPLETE` |

---

## 7. PHASE 06: CỔNG THÔNG TIN BỆNH NHÂN (PATIENT PORTAL) & THÔNG BÁO

| STT | Hạng mục / Tính năng | Vai trò liên quan | Trạng thái |
| :---: | :--- | :--- | :---: |
| 7.1 | Flyway Migration `V6__init_notifications.sql` | Developer | `NOT STARTED` |
| 7.2 | Đăng ký & Đăng nhập Cổng Bệnh nhân (Tự phục vụ) | PATIENT | `NOT STARTED` |
| 7.3 | Đặt lịch khám Bệnh trực tuyến trên Portal | PATIENT | `NOT STARTED` |
| 7.4 | Tra cứu Lịch sử Khám bệnh, Chẩn đoán & Kết quả CLS | PATIENT | `NOT STARTED` |
| 7.5 | Xem Đơn thuốc điện tử & Hướng dẫn sử dụng thuốc | PATIENT | `NOT STARTED` |
| 7.6 | Tra cứu Hóa đơn Viện phí & Xem Biên lai điện tử | PATIENT | `NOT STARTED` |
| 7.7 | Hệ thống Thông báo In-app & Nhắc lịch khám | PATIENT, RECEPTIONIST | `NOT STARTED` |
| 7.8 | Kiểm soát Quyền sở hữu Dữ liệu (Bệnh nhân chỉ xem hồ sơ mình) | PATIENT | `NOT STARTED` |

---

## 8. PHASE 07: KIỂM THỬ TỔNG THỂ, BẢO MẬT & ĐÓNG GÓI TRIỂN KHAI

| STT | Hạng mục / Tính năng | Vai trò liên quan | Trạng thái |
| :---: | :--- | :--- | :---: |
| 8.1 | Kiểm thử Tích hợp Chu trình Thăm khám Toàn vẹn (End-to-End) | QA, Developer | `NOT STARTED` |
| 8.2 | Kiểm thử Tải Đồng thời Xuất kho Dược (Concurrency & Lock Test) | QA, Developer | `NOT STARTED` |
| 8.3 | Kiểm thử Xâm nhập & Bảo mật (Pen-testing, SQLi, XSS, IDOR) | QA, Security | `NOT STARTED` |
| 8.4 | Tối ưu hóa Chỉ mục MySQL 8.4 LTS & Truy vấn chậm | Database Admin | `NOT STARTED` |
| 8.5 | Đóng gói Ứng dụng Backend Spring Boot thành JAR thực thi | DevOps | `NOT STARTED` |
| 8.6 | Build Ứng dụng Frontend React Vite thành Production Assets | Frontend Lead | `NOT STARTED` |
| 8.7 | Kịch bản Khởi chạy Dịch vụ Tự động trên Windows 10/11 Server | DevOps, Admin | `NOT STARTED` |
| 8.8 | Nghiệm thu Bàn giao Vận hành Hệ thống | Tất cả | `NOT STARTED` |
