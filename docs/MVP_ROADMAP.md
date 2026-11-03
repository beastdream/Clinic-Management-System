# LỘ TRÌNH VÀ PHẠM VI TÍNH NĂNG MVP (MVP_ROADMAP.MD)

> **Dự án**: Clinic Management System (CMS) — Hệ thống Quản lý Phòng khám Đa khoa / Chuyên khoa  
> **Kiến trúc**: Modular Monolith (Spring Boot 3 + Java 21 LTS, MySQL 8.4 LTS, React 18 + TypeScript)  
> **Phiên bản**: 1.0.0 | Ngày cập nhật: 2026-11-03

---

## 1. TỔNG QUAN LỘ TRÌNH TRIỂN KHAI THEO GIAI ĐOẠN

```
[Phase 00: Phân tích & Thiết kế Kiến trúc]  -->  COMPLETE
       ↓
[Phase 01: Nền tảng, Bảo mật & Dữ liệu Danh mục]  -->  COMPLETE (Cốt lõi hoạt động ổn định)
       ↓
[Phase 02: Quản lý Bệnh nhân, Lịch hẹn & Tiếp đón Hàng chờ]  -->  KẾ HOẠCH TIẾP THEO
       ↓
[Phase 03: Khám lâm sàng, Bệnh án điện tử & Chỉ định CLS]
       ↓
[Phase 04: Dược phẩm, Nhập kho theo Lô & Cấp phát FEFO]
       ↓
[Phase 05: Viện phí, Hóa đơn & Giao dịch Thanh toán]
       ↓
[Phase 06: Cổng thông tin Bệnh nhân (Patient Portal) & Thông báo]
       ↓
[Phase 07: Kiểm thử Toàn vẹn, Tối ưu Hiệu năng & Đóng gói Triển khai]
```

---

## 2. CHI TIẾT CÁC GIAI ĐOẠN VÀ TRẠNG THÁI (MILESTONES)

### Giai đoạn 00 — Phân tích Hệ thống & Thiết kế Kiến trúc (`COMPLETE`)
- [x] Quy tắc kiến trúc và ranh giới nghiệp vụ: `AGENTS.md`.
- [x] Thiết kế kiến trúc tổng thể Modular Monolith: `docs/architecture.md`.
- [x] Thiết kế Cơ sở dữ liệu và ràng buộc quan hệ: `docs/erd.md`.
- [x] Ma trận phân quyền đa vai trò (RBAC Matrix): `docs/rbac-matrix.md`.
- [x] Quy trình nghiệp vụ và máy trạng thái (State Machines): `docs/workflows.md`.
- [x] Danh mục Use Case y tế: `docs/use-cases.md`.
- [x] Kế hoạch thiết kế REST API chuẩn hóa: `docs/api-plan.md`.
- [x] Chiến lược kiểm thử toàn diện: `docs/testing-strategy.md`.

### Giai đoạn 01 — Khung Nền tảng, Bảo mật & MySQL (`COMPLETE`)
- [x] **Backend**:
  - Spring Boot 3.3.5 chạy trên Java 21 / 24 compatibility.
  - Spring Security 6 với JWT stateless filter, mã hóa BCrypt.
  - Xử lý ngoại lệ toàn cục (`GlobalExceptionHandler`), chuẩn envelope (`ApiResponse`, `PageResponse`).
  - Phân hệ `auth` (`/api/v1/auth/login`, `/refresh`, `/me`).
  - Giám sát sức khỏe và kiểm tra kết nối DB thời gian thực (`/api/v1/health`).
- [x] **Database**:
  - Kết nối MySQL 8.0/8.4 LTS InnoDB, charset `utf8mb4`.
  - Flyway migration `V1__init_core_schema.sql` (18 bảng cốt lõi).
  - Flyway migration `V2__seed_initial_data.sql` (6 Roles, 30 Permissions, tài khoản ADMIN mặc định, cơ sở, chuyên khoa, phòng khám và dịch vụ kỹ thuật).
- [x] **Frontend**:
  - React 18, TypeScript strict mode, Vite 5, Tailwind CSS, shadcn/ui.
  - Axios interceptor gắn JWT token tự động và xử lý lỗi đồng nhất.
  - Bảng điều khiển kiểm tra kết nối thời gian thực: `HealthDashboardPage`.

### Giai đoạn 02 — Quản lý Bệnh nhân, Lịch hẹn & Hàng chờ Tiếp đón (`NOT STARTED`)
- [ ] Flyway Migration: `patient_queues`, `appointments` chi tiết.
- [ ] Quản lý hồ sơ bệnh nhân (tìm kiếm CCCD, SĐT, sinh mã tự động).
- [ ] Tiếp đón check-in tại quầy và cấp số thứ tự vào phòng khám.
- [ ] Bảng điện tử hiển thị hàng chờ (Queue Display Board).

### Giai đoạn 03 — Khám Lâm sàng, Bệnh án Điện tử & Kê đơn Thuốc (`NOT STARTED`)
- [ ] Bàn làm việc Bác sĩ (Doctor Clinical Workspace).
- [ ] Sinh hiệu (Vitals, huyết áp, mạch, SpO2, BMI).
- [ ] Chẩn đoán ICD-10 và chỉ định cận lâm sàng (Xét nghiệm, CĐHA).
- [ ] Kê đơn thuốc điện tử và khóa bệnh án hoàn tất.
- [ ] Rào chắn bảo mật: Chặn quyền xem bệnh án đối với tài khoản Admin.

### Giai đoạn 04 — Quản lý Dược phẩm, Kho theo Lô & Cấp phát FEFO (`NOT STARTED`)
- [ ] Danh mục thuốc, hoạt chất, quy cách và nhà cung cấp.
- [ ] Nhập kho theo Lô (Batch) và Hạn sử dụng (Expiry Date).
- [ ] Khóa bi quan (`Pessimistic Lock`) chống xuất âm / race condition.
- [ ] Thuật toán tự động xuất kho theo hạn gần nhất (First Expired, First Out).

### Giai đoạn 05 — Viện phí, Hóa đơn & Thu ngân (`NOT STARTED`)
- [ ] Lập hóa đơn tự động từ dịch vụ kỹ thuật và đơn thuốc.
- [ ] Thu tiền đa phương thức (Tiền mặt, Chuyển khoản QR, Thẻ POS).
- [ ] Cơ chế `idempotency_key` chống thanh toán trùng lặp.
- [ ] In biên lai / phiếu thu viện phí chuẩn và hoàn tiền có kiểm duyệt.

### Giai đoạn 06 — Cổng Bệnh nhân (Patient Portal) & Thông báo (`NOT STARTED`)
- [ ] Đăng ký / đăng nhập cổng portal bằng tài khoản cá nhân.
- [ ] Tra cứu lịch hẹn, lịch sử khám, toa thuốc điện tử và viện phí.
- [ ] Kiểm tra Data Ownership: Bệnh nhân chỉ xem được dữ liệu của chính mình.

### Giai đoạn 07 — Kiểm thử Tổng thể, Tối ưu & Nghiệm thu (`NOT STARTED`)
- [ ] Kiểm thử tích hợp End-to-End chu trình thăm khám.
- [ ] Kiểm thử chịu tải đồng thời kho thuốc và thanh toán.
- [ ] Đóng gói tự động và tài liệu hướng dẫn vận hành production.

---

## 3. NGUYÊN TẮC BẢO ĐẢM CHẤT LƯỢNG
- Mọi giai đoạn tiếp theo bắt buộc phải kế thừa toàn vẹn các migration V1, V2 đã thiết lập.
- Không sửa file migration cũ; mọi thay đổi schema được bổ sung bằng migration mới tăng dần (`V3__...`, `V4__...`).
- Không xóa database hoặc dữ liệu thực tế.
- Frontend luôn gọi API thực tế qua Axios và TanStack Query.

