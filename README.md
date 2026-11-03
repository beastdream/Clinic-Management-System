# HỆ THỐNG QUẢN LÝ PHÒNG KHÁM ĐA KHOA (CLINIC MANAGEMENT SYSTEM)

Dự án phần mềm quản lý phòng khám đa khoa tư nhân toàn diện, xây dựng trên kiến trúc **Modular Monolith**, tuân thủ nghiêm ngặt các quy chuẩn bảo mật y tế, quản lý kho thuốc theo lô/hạn dùng (FEFO) và tính toán tài chính chính xác (`DECIMAL(19, 2)`).

---

## 1. YÊU CẦU MÔI TRƯỜNG HỆ THỐNG (SYSTEM PREREQUISITES)

Hệ điều hành: **Windows 10/11 (64-bit)**

| Thành phần | Phiên bản yêu cầu | Ghi chú kiểm tra |
| :--- | :--- | :--- |
| **Java Development Kit (JDK)** | Java 21 LTS hoặc Java 24 | Chạy `java -version` |
| **Apache Maven** | Maven 3.9+ | Chạy `mvn -version` |
| **Node.js & npm** | Node.js v20+ / v22+ & npm 10+ | Chạy `node -v` và `npm -v` |
| **MySQL Server** | MySQL 8.0+ / 8.4 LTS | Chạy cổng 3306, InnoDB, utf8mb4 |
| **Docker & Docker Compose** (Tùy chọn) | Docker Desktop v4+ | Khởi chạy MySQL container tự động |

---

## 2. CẤU TRÚC DỰ ÁN (PROJECT DIRECTORIES)

```
Clinic Management System/
├── backend/                       # Spring Boot 3.3.5 Modular Monolith (Java 21)
│   ├── src/main/java/com/clinicmanagement/
│   │   ├── common/                # Shared kernel (BaseEntity, ApiResponse, PageResponse, Exceptions)
│   │   ├── config/                # Security, CORS, OpenAPI Swagger, Jackson
│   │   ├── security/              # JWT Token Provider, UserPrincipal, CustomUserDetails
│   │   ├── auth/                  # Authentication Controller & Service (Login, Token)
│   │   ├── user/                  # Quản lý tài khoản, Vai trò (Roles), Phân quyền (Permissions)
│   │   ├── staff/                 # Hồ sơ nhân viên y tế & lịch làm việc
│   │   ├── clinic/                # Cơ sở, chuyên khoa, phòng khám chức năng
│   │   ├── patient/               # Hồ sơ bệnh nhân, liên kết cổng portal
│   │   ├── appointment/           # Lịch hẹn, ca khám
│   │   ├── encounter/             # Lượt khám, sinh hiệu, chẩn đoán ICD-10
│   │   ├── prescription/          # Kê đơn thuốc điện tử
│   │   ├── inventory/             # Danh mục thuốc, quản lý lô & HSD (FEFO)
│   │   ├── billing/               # Bảng giá dịch vụ, hóa đơn, thanh toán
│   │   ├── notification/          # Thông báo, nhắc lịch
│   │   └── audit/                 # Lưu vết kiểm toán y tế (Audit Logs)
│   ├── src/main/resources/
│   │   ├── application.yml        # Cấu hình gốc
│   │   ├── application-dev.yml    # Cấu hình môi trường phát triển (MySQL 8.4)
│   │   └── db/migration/          # Flyway Migrations (V1 Core Schema, V2 Seed Data)
│   └── pom.xml
│
├── frontend/                      # React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
│   ├── src/
│   │   ├── components/            # UI components (Button, Card, Badge, Alert, Skeleton...)
│   │   ├── layouts/               # DashboardLayout, AuthLayout
│   │   ├── pages/                 # HealthDashboardPage, Modules Pages
│   │   ├── services/              # Axios API clients (authService, healthService...)
│   │   ├── types/                 # TypeScript interfaces (api, auth, health)
│   │   ├── lib/                   # Axios instance, QueryClient, formatters
│   │   └── routes/                # React Router v6 navigation
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
│
├── docs/                          # Tài liệu kiến trúc, ERD, RBAC, API, Workflows
└── reports/                       # Báo cáo nghiệm thu các Phase & Feature Checklist
```

---

## 3. HƯỚNG DẪN CÀI ĐẶT & KHỞI CHẠY (WINDOWS POWERSHELL / CMD)

### Bước 1: Khởi tạo Cơ sở Dữ liệu MySQL

Mở **PowerShell** hoặc **MySQL Command Line Client**:
```sql
CREATE DATABASE IF NOT EXISTS clinic_management
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

> **Cách thay thế (Docker Compose):**
> Nếu đã cài Docker Desktop, tại thư mục gốc dự án chạy:
> ```powershell
> docker compose up -d
> ```
> Container MySQL sẽ khởi chạy trên cổng `3306` với cơ sở dữ liệu `clinic_management`.

### Bước 2: Cấu hình Biến Môi trường (Environment Variables)

Sao chép file `.env.example` thành file `.env` hoặc thiết lập biến môi trường trên Windows PowerShell:
```powershell
# Thiết lập mật khẩu MySQL của máy bạn (mặc định nếu không set là 123456)
$env:DB_USERNAME="root"
$env:DB_PASSWORD="your_mysql_password"
$env:JWT_SECRET="ClinicSecretKey2026SecureJwtTokenWithSufficientLengthForHS512AlgorithmValidationRequirement"
```

### Bước 3: Khởi chạy Backend (Spring Boot 3)

Mở cửa sổ PowerShell mới:
```powershell
cd "d:\Clinic Management System\backend"
mvn spring-boot:run
```
Khi ứng dụng khởi động:
- **Flyway** sẽ tự động thực thi các file migrations:
  - `V1__init_core_schema.sql` (Tạo 18 bảng nền tảng).
  - `V2__seed_initial_data.sql` (Nạp vai trò, quyền, admin, phòng khám, chuyên khoa, phòng và dịch vụ mẫu).
  - `V3__init_patient_appointment_queue.sql` (Lược đồ Lịch hẹn và Hàng chờ tiếp đón).
  - `V4__seed_comprehensive_demo_data.sql` (25 bệnh nhân, 5 bác sĩ, 25 lịch hẹn, 15 thuốc mẫu).
  - `V5__init_clinical_encounters.sql` (Bảng lượt khám lâm sàng, sinh hiệu, chẩn đoán, khóa an toàn).
  - `V6__init_billing_invoices.sql` (Hóa đơn viện phí, chi tiết dịch vụ, thanh toán tiền mặt/chuyển khoản).
  - `V7__add_updated_at_to_payments.sql` (Bổ sung audit column cho bảng payments).
- **Backend API**: `http://localhost:8080/api/v1`
- **Tài liệu Swagger UI**: `http://localhost:8080/swagger-ui.html`
- **Health Check Endpoint**: `http://localhost:8080/api/v1/health`

### Bước 4: Khởi chạy Frontend (React + Vite)

Mở một cửa sổ PowerShell khác:
```powershell
cd "d:\Clinic Management System\frontend"
npm install
npm run dev
```
Truy cập giao diện: `http://localhost:5173`
- Trang Quản lý Bệnh nhân: `http://localhost:5173/patients`
- Trang Quản lý Lịch hẹn & Tiếp đón: `http://localhost:5173/appointments`
- Trang Đội ngũ Bác sĩ: `http://localhost:5173/doctors`
- Trang Khám bệnh & Bệnh án Lâm sàng: `http://localhost:5173/clinical`
- Trang Thu ngân & Viện phí (Billing): `http://localhost:5173/billing`

---

## 4. TÀI KHOẢN MẪU KHỞI TẠO (DEFAULT SEED CREDENTIALS)

Hệ thống đã được nạp sẵn các tài khoản phân quyền chuẩn theo `AGENTS.md`:

| Vai trò | Tên đăng nhập | Mật khẩu | Quyền hạn tiêu biểu |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (ADMIN)** | `admin` | `Admin@123456` | Quản trị hệ thống, danh mục, tài khoản, nhân viên (Chặn xem bệnh án) |
| **Bác sĩ (DOCTOR)** | `bs_minh` | `Doctor@123456` | Xem hàng chờ khám, thăm khám, ghi nhận sinh hiệu, chẩn đoán, hoàn tất bệnh án |
| **Bác sĩ 2 (DOCTOR)** | `bs_huong` | `Doctor@123456` | Bác sĩ chuyên khoa Nhi |
| **Tiếp tân (RECEPTIONIST)** | `tieptan_mai` | `Staff@123456` | Đặt lịch khám, Check-in tiếp đón bệnh nhân |
| **Thu ngân (CASHIER)** | `thungan_hang` | `Staff@123456` | Thu ngân, quản lý thanh toán viện phí |
| **Bệnh nhân (PATIENT)** | `benhnhan_an` | `Patient@123456` | Cổng thông tin bệnh nhân (Portal), xem bệnh án của chính mình |

---

## 5. KIỂM THỬ HỆ THỐNG (AUTOMATED TESTS)

Để chạy bộ kiểm thử tích hợp kết nối Database, Flyway và JWT Security của Backend:
```powershell
cd "d:\Clinic Management System\backend"
mvn test
```

Để chạy kịch bản kiểm thử End-to-End tự động luồng Khám bệnh Lâm sàng (Check-in -> Queue -> Start Encounter -> Save Draft -> Complete -> Security Check):
```powershell
powershell -ExecutionPolicy Bypass -File "scripts/verify_clinical_encounter.ps1"
```

Để chạy kịch bản kiểm thử End-to-End tự động luồng Thu ngân & Viện phí (Lập hóa đơn -> Tính viện phí server-side -> Thanh toán Tiền mặt/Chuyển khoản -> Chống thanh toán trùng -> Hủy hóa đơn -> Đối soát doanh thu):
```powershell
powershell -ExecutionPolicy Bypass -File "scripts/verify_billing_module.ps1"
```

Để chạy kịch bản kiểm thử Tự động Dashboard Thống kê & Phân quyền RBAC (401 Unauthenticated -> Đối soát số liệu MySQL -> 403 Forbidden Admin chặn bệnh án -> Bác sĩ/Thu ngân/Tiếp tân kiểm tra quyền):
```powershell
powershell -ExecutionPolicy Bypass -File "scripts/verify_dashboard_and_rbac.ps1"
```

Để kiểm tra biên dịch TypeScript strict mode và đóng gói Frontend:
```powershell
cd "d:\Clinic Management System\frontend"
npm run build
```
