# QUY TẮC PHÁT TRIỂN HỆ THỐNG PHÒNG KHÁM (AGENTS.MD)

> **Tài liệu hướng dẫn bắt buộc cho tất cả các AI Agents và Developers tham gia phát triển dự án Clinic Management System.**
> Phiên bản: 1.0.0 | Cập nhật lần cuối: 2026-10-15

---

## 1. NGUYÊN TẮC CỐT LÕI (CORE ARCHITECTURAL RULES)

Mọi thay đổi mã nguồn trong các Phase tiếp theo PHẢI tuân thủ nghiêm ngặt 10 nguyên tắc sau:

1. **Tách biệt User Account và Patient Record**:
   - `User` đại diện cho danh tính xác thực (authentication, credentials, roles).
   - `Patient` đại diện cho hồ sơ nhân khẩu và y tế lâm sàng của người bệnh.
   - Bệnh nhân vãng lai khám tại quầy KHÔNG bắt buộc phải có tài khoản `User`. Khi bệnh nhân đăng ký cổng portal, liên kết 1-1 thông qua `user_id` (nullable unique FK) trong bảng `patients`.
2. **Nhân viên đa vai trò (Multi-role Staff)**:
   - Một nhân viên có thể sở hữu nhiều quyền/vai trò (ví dụ: vừa là RECEPTIONIST vừa là CASHIER).
   - Thiết kế quan hệ `users` - `roles` là N - N thông qua bảng `user_roles`.
3. **Phân quyền đa tầng (Defense in Depth) & Kiểm tra Ownership**:
   - Mọi REST API nghiệp vụ phải kiểm tra RBAC ở tầng Controller/Service (`@PreAuthorize`).
   - Phải kiểm tra quyền sở hữu dữ liệu (Data Ownership): Bệnh nhân chỉ xem được dữ liệu của chính mình (`patient.user_id == principal.id`), Bác sĩ chỉ xem/sửa bệnh án bệnh nhân mình phụ trách hoặc có phân công trực.
4. **Nguyên tắc "Admin không có quyền xem bệnh án" (Clinical Privacy)**:
   - Tài khoản có vai trò `ADMIN` KHÔNG tự động có quyền đọc chi tiết hồ sơ bệnh án, chẩn đoán, kết quả xét nghiệm nhạy cảm của bệnh nhân, trừ khi được cấp quyền đặc biệt có lưu vết audit rõ ràng.
5. **Cấm xóa vật lý (No Hard Delete)**:
   - Dữ liệu y tế (bệnh án, kết quả khám, chỉ định, đơn thuốc) và giao dịch tài chính (hóa đơn, biên lai thanh toán) KHÔNG BAO GIỜ được xóa vật lý (`DELETE`).
   - Sử dụng Soft Delete (`deleted_at`, `deleted_by`) hoặc cấm hoàn toàn xóa (chỉ cho phép chuyển trạng thái `CANCELLED` / `VOIDED`).
   - Mọi hành vi truy cập và thao tác nhạy cảm phải ghi nhận vào `audit_logs`.
6. **Quản lý Dược phẩm theo Lô (Batch) và Hạn sử dụng (Expiry Date)**:
   - Mọi viên thuốc/vật tư xuất kho cho bệnh nhân đều phải truy xuất được từ Lô nhập cụ thể (`medicine_batches`). Áp dụng nguyên tắc FEFO (First Expired, First Out).
7. **Toàn vẹn giao dịch Tài chính và Kho (ACID Transactions)**:
   - Các nghiệp vụ: Thanh toán hóa đơn, Hoàn tiền, Xuất kho cấp phát thuốc BẮT BUỘC đặt trong `@Transactional` của Spring.
   - Sử dụng khóa bi quan (`Pessimistic Lock`) hoặc khóa lạc quan (`@Version` Optimistic Lock) để chống Race Condition khi trừ tồn kho.
8. **Tuyệt đối không dùng số thực (Floating-point) cho Tiền và Tồn kho**:
   - Tiền tệ: Dùng `BigDecimal` (Java) và `DECIMAL(15, 2)` (MySQL). Đơn vị tiền tệ chuẩn là VNĐ.
   - Số lượng thuốc/vật tư: Dùng `DECIMAL(12, 3)` (đối với thể tích/khối lượng chia nhỏ) hoặc `INT` (đối với viên/vỉ/hộp).
9. **Dữ liệu giả lập an toàn (Synthetic Medical Data)**:
   - Tuyệt đối không đưa dữ liệu bệnh nhân hoặc bệnh án thật lên kho mã nguồn, môi trường dev, test hay demo.
10. **Giao diện Tiếng Việt chuẩn y tế (Vietnamese Localization)**:
    - Toàn bộ giao diện người dùng (UI), thông báo lỗi nghiệp vụ, nhãn form, báo cáo, toa thuốc in ra đều sử dụng Tiếng Việt chuẩn mực, đúng thuật ngữ y khoa hiện hành tại Việt Nam.

---

## 2. QUY CHUẨN BACKEND (JAVA 21 & SPRING BOOT)

### 2.1. Cấu trúc thư mục Modular Monolith
Hệ thống backend được tổ chức theo kiến trúc **Modular Monolith**, các domain packages độc lập:
```
backend/
├── src/main/java/com/clinic/
│   ├── ClinicManagementApplication.java
│   ├── common/               # Shared kernel: BaseEntity, Exceptions, DTO envelope, Utils
│   │   ├── audit/            # Auditing listener, Spring Data JPA Audit
│   │   ├── exception/        # GlobalExceptionHandler, BusinessException, ErrorCode
│   │   ├── response/         # ApiResponse, PageResponse
│   │   └── security/         # SecurityContextHelper, JwtTokenProvider, UserPrincipal
│   ├── config/               # SecurityConfig, CorsConfig, OpenApiConfig, JacksonConfig
│   └── modules/              # Domain Modules
│       ├── core/             # Quản lý Users, Staff, Roles, Permissions, Auth
│       ├── clinic/           # Phòng khám, Chuyên khoa, Phòng chức năng, Dịch vụ kỹ thuật
│       ├── patient/          # Hồ sơ Bệnh nhân, Tiền sử, Dị ứng
│       ├── appointment/      # Lịch hẹn, Lịch trực bác sĩ, Phân luồng tiếp đón
│       ├── clinical/         # Lượt khám (Encounter), Sinh hiệu, Chẩn đoán, Chỉ định
│       ├── pharmacy/         # Danh mục thuốc, Nhà cung cấp, Nhập kho, Lô hạn dùng, Cấp phát
│       ├── billing/          # Hóa đơn, Thanh toán, Biên lai, Bảng giá, Báo cáo tài chính
│       ├── notification/     # Thông báo hệ thống, SMS/Email reminder
│       └── audit/            # Audit log interceptor & repository
└── src/main/resources/
    ├── application.yml
    └── db/migration/         # Flyway migration scripts (V1__init.sql, V2__...)
```

### 2.2. Giao tiếp giữa các Module
- Ưu tiên gọi nội bộ thông qua Interface Service của module khác.
- Tuyệt đối không truy cập trực tiếp Repository của module khác từ module hiện tại (trừ trường hợp Module Core dùng chung).
- Đối với các side-effect (ví dụ: tạo lượt khám xong -> gửi thông báo), sử dụng Spring Application Event (`@EventListener` / `@TransactionalEventListener`).

### 2.3. Quy chuẩn Mã nguồn Backend
- **Java 21 Features**: Sử dụng Record cho Immutable DTOs, Pattern Matching cho `switch`, Virtual Threads (khi phù hợp).
- **Validation**: Sử dụng `jakarta.validation` (`@NotNull`, `@Size`, `@Pattern`, `@DecimalMin`).
- **Response Format chuẩn**:
  ```json
  {
    "success": true,
    "code": "SUCCESS",
    "message": "Thao tác thành công",
    "data": { ... },
    "timestamp": "2026-10-15T16:20:00Z"
  }
  ```
- **Lỗi nghiệp vụ**: Ném `BusinessException(ErrorCode.XYZ)` được đón bởi `@RestControllerAdvice` trả về mã lỗi chuẩn RFC 7807.

---

## 3. QUY CHUẨN CƠ SỞ DỮ LIỆU (MYSQL 8.4 LTS)

1. **Migration Tool**: Dùng **Flyway**. Tên file: `V{version}__{description_snake_case}.sql`. Không bao giờ chỉnh sửa script migration đã commit và đã chạy.
2. **Quy tắc đặt tên Database**:
   - Tên bảng: `snake_case`, số nhiều (ví dụ: `appointments`, `prescriptions`, `medicine_batches`).
   - Tên cột: `snake_case` (ví dụ: `patient_id`, `created_at`, `is_active`).
   - Khóa chính: `id BIGINT AUTO_INCREMENT` hoặc `UUID` (dùng `id BIGINT AUTO_INCREMENT` cho performance đánh index tốt nhất trên MySQL B-Tree).
   - Foreign Key: `{tên_bảng_số_ít}_id` (ví dụ: `patient_id`, `doctor_id`).
3. **Cột Audit bắt buộc trên mọi bảng dữ liệu chính**:
   - `created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`
   - `updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
   - `created_by BIGINT NULL`
   - `updated_by BIGINT NULL`
   - `deleted_at DATETIME NULL` (đối với bảng áp dụng soft delete)
4. **Encoding**: `utf8mb4`, Collation: `utf8mb4_unicode_ci`, Storage Engine: `InnoDB`.

---

## 4. QUY CHUẨN FRONTEND (REACT + TYPESCRIPT + VITE)

### 4.1. Cấu trúc thư mục Frontend
```
frontend/
├── src/
│   ├── assets/               # Logo, hình ảnh, icons
│   ├── components/           # Shared UI components (shadcn/ui, Layout, Header, Sidebar)
│   │   ├── ui/               # shadcn/ui components (button, dialog, table, input...)
│   │   ├── feedback/         # LoadingSkeleton, ErrorBoundary, EmptyState
│   │   └── guard/            # ProtectedRoute, RoleGuard, PermissionGuard
│   ├── config/               # App configuration, navigation items, constants
│   ├── contexts/             # AuthContext, ThemeContext, SocketContext
│   ├── hooks/                # Custom hooks (useAuth, useDebounce, usePermission)
│   ├── layouts/              # AuthLayout, DashboardLayout, PatientPortalLayout
│   ├── lib/                  # axios instance, utils, formatters (date, currency)
│   ├── pages/                # Các trang theo Module/Role
│   │   ├── auth/             # Login, ForgotPassword, Register
│   │   ├── admin/            # Quản trị hệ thống, danh mục, người dùng, báo cáo
│   │   ├── receptionist/     # Tiếp đón, Lịch hẹn, Hàng chờ, Check-in
│   │   ├── doctor/           # Khám bệnh, Bệnh án, Kê đơn, Chỉ định CLS
│   │   ├── cashier/          # Thu ngân, Thanh toán, Xuất biên lai, Báo cáo thu
│   │   ├── pharmacy/         # Dược, Kho thuốc, Cấp phát theo toa
│   │   └── patient/          # Cổng thông tin bệnh nhân (Portal)
│   ├── routes/               # AppRoutes, route guards
│   ├── services/             # API services chia theo domain
│   ├── types/                # TypeScript interfaces, Zod schemas, Enum types
│   └── App.tsx
```

### 4.2. Quy chuẩn Mã nguồn Frontend
- **Giao diện**: Tailwind CSS kết hợp shadcn/ui. Bảng màu y tế chuyên nghiệp: Xanh Teal y tế (`#0d9488` / `#0f766e`), Xanh Navy (`#1e293b`), Trắng sạch, Điểm nhấn Cam hổ phách cảnh báo (`#f59e0b`).
- **Form Handling**: 100% form sử dụng `react-hook-form` kết hợp `zod` schema để validate từ phía client trước khi submit.
- **Server State**: Sử dụng `@tanstack/react-query` cho mọi thao tác fetch/cache/mutate dữ liệu từ Backend.
- **Xử lý số tiền**: Luôn định dạng tiền VNĐ bằng hàm tiện ích chuẩn (ví dụ: `new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })`).

---

## 5. BẢO MẬT VÀ PHÂN QUYỀN (SECURITY & RBAC)

1. **Authentication**: JWT (JSON Web Token) ngắn hạn (15-30 phút) kèm cơ chế Refresh Token lưu trong HttpOnly Cookie hoặc storage an toàn có cơ chế thu hồi (Revocation / Blacklist trên Redis hoặc DB).
2. **Password Policy**: Mã hóa bằng BCrypt (strength 10-12), tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt. Khóa tài khoản tạm thời sau 5 lần đăng nhập sai liên tiếp.
3. **CORS & CSRF**: Cấu hình CORS chặt chẽ, chỉ cho phép domain frontend được chỉ định.
4. **Audit Logging**: Mọi hành vi: Đăng nhập, Thay đổi quyền, Xem/sửa bệnh án, Xuất kho thuốc, Hủy hóa đơn, Hoàn tiền ĐỀU PHẢI được ghi vào bảng `audit_logs` với IP, User Agent, Timestamp, Action, Old Value, New Value.

---

## 6. QUY TRÌNH KIỂM THỬ VÀ DEFINITION OF DONE (DOD)

Một tính năng chỉ được xem là **COMPLETE** khi thỏa mãn:
1. Có migration script database chuẩn xác (nếu có thay đổi DB).
2. Có Entity, Repository, Service, Controller với đầy đủ `@PreAuthorize`.
3. Validation chặt chẽ ở cả Frontend (Zod) và Backend (Jakarta Validation).
4. Viết Unit Test cho Business Logic trọng yếu (đặc biệt: Tính tiền hóa đơn, Khấu trừ kho FEFO, Chuyển trạng thái lượt khám).
5. Giao diện mượt mà, thông báo trạng thái rõ ràng (Loading, Empty, Error, Success), responsive trên màn hình làm việc (Desktop/Tablet).
6. Không có lỗi linting/TypeScript. Cập nhật trạng thái trong `reports/FEATURE_CHECKLIST.md`.
