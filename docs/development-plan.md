# KẾ HOẠCH TRIỂN KHAI DỰ ÁN THEO GIAI ĐOẠN (DEVELOPMENT-PLAN.MD)

> **Mô hình triển khai**: Phân kỳ theo Phase tuần tự (Incremental & Iterative Milestones)  
> **Kiến trúc**: Modular Monolith  
> **Phiên bản**: 1.0.0 | Ngày lập: 2026-10-15

---

## 1. TỔNG QUAN LỘ TRÌNH PHÁT TRIỂN (ROADMAP)

Dự án được chia thành **8 Phase** chặt chẽ, đảm bảo tính kế thừa, kiểm thử liên tục và không làm gãy vỡ kiến trúc:

```
[Phase 00: Thiết kế & Kiến trúc]  (ĐANG HOÀN TẤT)
       ↓
[Phase 01: Khung nền tảng, Bảo mật & Dữ liệu Danh mục]
       ↓
[Phase 02: Quản lý Bệnh nhân, Lịch hẹn & Tiếp đón Hàng chờ]
       ↓
[Phase 03: Khám lâm sàng, Bệnh án điện tử & Chỉ định CLS]
       ↓
[Phase 04: Dược phẩm, Nhập kho theo Lô (Batch/HSD) & Cấp phát FEFO]
       ↓
[Phase 05: Viện phí, Hóa đơn & Giao dịch Thanh toán]
       ↓
[Phase 06: Cổng thông tin Bệnh nhân (Patient Portal) & Thông báo]
       ↓
[Phase 07: Kiểm thử Tổng thể, Tối ưu Hiệu năng & Đóng gói Triển khai]
```

---

## 2. KẾ HOẠCH CHI TIẾT TỪNG PHASE

### PHASE 00: PHÂN TÍCH HỆ THỐNG VÀ THIẾT KẾ KIẾN TRÚC
- **Mục tiêu**: Hoàn thiện toàn bộ tài liệu đặc tả kiến trúc, ERD, RBAC, API Plan, Workflows, và bộ quy chuẩn phát triển (AGENTS.md).
- **Kết quả bàn giao**:
  - `AGENTS.md`
  - Thư mục `docs/` (`architecture.md`, `erd.md`, `rbac-matrix.md`, `workflows.md`, `use-cases.md`, `api-plan.md`, `development-plan.md`, `testing-strategy.md`).
  - `reports/FEATURE_CHECKLIST.md` với trạng thái ban đầu.
- **Tiêu chí nghiệm thu**: Toàn bộ tài liệu đồng nhất 100%, không mâu thuẫn khái niệm, sẵn sàng cho Phase 01.

---

### PHASE 01: KHUNG NỀN TẢNG, BẢO MẬT & DỮ LIỆU DANH MỤC (CORE & MASTER DATA)
- **Mục tiêu**: Xây dựng bộ khung Backend Spring Boot (Java 21) và Frontend React Vite, thiết lập JWT Authentication, phân quyền RBAC và quản lý danh mục dùng chung.
- **Phụ thuộc**: Hoàn thành Phase 00.
- **Nội dung công việc**:
  - *Database*: Flyway script `V1__init_core_and_master_data.sql` (bảng `users`, `roles`, `permissions`, `staff_profiles`, `clinics`, `specialties`, `rooms`, `medical_services`, `audit_logs`).
  - *Backend*: 
    - Cấu hình Spring Security 6 với JWT filter, Refresh token rotation.
    - Global exception handler & ApiResponse envelope.
    - CRUD Người dùng, phân quyền, cấu hình phòng ốc và dịch vụ kỹ thuật.
    - `@PreAuthorize` và Auditing Entity Listener.
  - *Frontend*:
    - Khởi tạo project React + TypeScript + Vite + Tailwind CSS + shadcn/ui.
    - Xây dựng Auth layout, Dashboard layout với Sidebar responsive theo Role.
    - Giao diện Đăng nhập, Quản lý tài khoản người dùng, Quản lý danh mục phòng khám.
- **Tiêu chuẩn hoàn thành (DoD)**: Đăng nhập được 6 role, admin phân quyền được nhân viên, token có hạn dùng an toàn.

---

### PHASE 02: QUẢN LÝ BỆNH NHÂN, LỊCH HẸN & TIẾP ĐÓN HÀNG CHỜ (PATIENT & QUEUE)
- **Mục tiêu**: Xây dựng phân hệ hồ sơ bệnh nhân, quản lý ca trực bác sĩ, đặt lịch khám và điều phối hàng chờ tiếp đón tại quầy.
- **Phụ thuộc**: Hoàn thành Phase 01.
- **Nội dung công việc**:
  - *Database*: Flyway script `V2__init_patient_appointment_queue.sql` (bảng `patients`, `doctor_schedules`, `appointments`, `patient_queues`).
  - *Backend*:
    - Module `patient`: CRUD bệnh nhân, tìm kiếm theo CCCD/SĐT, đánh số mã BN chuẩn `BN-YYYYMMDD-XXXX`.
    - Module `appointment`: Phân ca trực bác sĩ, kiểm tra slot trống, đặt lịch hẹn, tiếp đón check-in, cấp số hàng chờ tự động.
    - Quản lý trạng thái hàng chờ (`WAITING`, `CALLING`, `IN_CONSULTATION`).
  - *Frontend*:
    - Màn hình Tiếp đón bệnh nhân cho Tiếp tân (tìm kiếm nhanh, form đăng ký mới bằng React Hook Form + Zod).
    - Màn hình Lịch làm việc bác sĩ và sơ đồ phòng khám.
    - Màn hình Bảng điện tử gọi số thứ tự hàng chờ (Queue Display Board).
- **Tiêu chuẩn hoàn thành (DoD)**: Tiếp tân check-in thành công bệnh nhân vào phòng khám, số thứ tự nhảy chính xác theo ngày.

---

### PHASE 03: KHÁM LÂM SÀNG, BỆNH ÁN ĐIỆN TỬ & KÊ ĐƠN THUỐC (CLINICAL WORKSPACE)
- **Mục tiêu**: Xây dựng bàn làm việc số cho Bác sĩ (Doctor Clinical Workspace) gồm khám lâm sàng, sinh hiệu, chẩn đoán ICD-10, chỉ định CLS và kê đơn thuốc điện tử.
- **Phụ thuộc**: Hoàn thành Phase 02.
- **Nội dung công việc**:
  - *Database*: Flyway script `V3__init_clinical_domain.sql` (bảng `encounters`, `patient_vitals`, `encounter_diagnoses`, `medical_orders`, `prescriptions`, `prescription_items`).
  - *Backend*:
    - State machine cho `Encounter` (`IN_PROGRESS` -> `PENDING_LABS` -> `COMPLETED`).
    - API ghi nhận chỉ số sinh hiệu (Vitals), chẩn đoán danh mục ICD-10.
    - API chỉ định xét nghiệm/CĐHA và nhập kết quả đính kèm file.
    - Kê đơn thuốc điện tử, kiểm tra tương tác thuốc/dị ứng cơ bản.
    - Khóa bệnh án sau khi hoàn tất (chống sửa đổi bất hợp pháp).
  - *Frontend*:
    - Giao diện Dashboard của Bác sĩ: Danh sách chờ khám, hồ sơ bệnh nhân đang khám.
    - Form nhập sinh hiệu có biểu đồ theo dõi chỉ số (Recharts).
    - Form chẩn đoán ICD-10 với tìm kiếm autocomplete.
    - Form kê đơn thuốc điện tử nhanh chóng, hiển thị tồn kho thuốc.
- **Tiêu chuẩn hoàn thành (DoD)**: Bác sĩ hoàn thành trọn vẹn 1 ca khám từ sinh hiệu, chẩn đoán đến đơn thuốc và khóa bệnh án.

---

### PHASE 04: DƯỢC PHẨM, NHẬP KHO THEO LÔ & CẤP PHÁT FEFO (PHARMACY & INVENTORY)
- **Mục tiêu**: Xây dựng phân hệ quản lý kho dược toàn diện, theo dõi số lô & hạn sử dụng, chống bán quá tồn kho và tự động xuất kho theo cơ chế FEFO.
- **Phụ thuộc**: Hoàn thành Phase 03.
- **Nội dung công việc**:
  - *Database*: Flyway script `V4__init_pharmacy_inventory.sql` (bảng `suppliers`, `medicines`, `purchase_orders`, `medicine_batches`, `inventory_transactions`, `prescription_dispensations`).
  - *Backend*:
    - Quản lý danh mục biệt dược, hoạt chất, quy cách đóng gói.
    - Nhập kho theo đơn đặt hàng PO: ghi nhận Batch code, Expiry date, Giá vốn.
    - Thuật toán xuất kho FEFO kết hợp khóa bi quan `Pessimistic Lock` (`FOR UPDATE`) và `@Transactional`.
    - Cảnh báo thuốc sắp hết hạn (<= 90 ngày) và thuốc dưới mức tồn an toàn.
  - *Frontend*:
    - Màn hình Quản lý kho thuốc, danh sách Lô & Hạn sử dụng.
    - Màn hình Tạo phiếu nhập kho hàng từ nhà cung cấp.
    - Màn hình Dược sĩ xuất kho cấp phát thuốc theo đơn đã thanh toán.
    - Biểu đồ thống kê biến động kho và cảnh báo hạn dùng (Recharts).
- **Tiêu chuẩn hoàn thành (DoD)**: Xuất thuốc tự động trừ lô hạn gần nhất, không thể xuất âm kho khi 2 quầy cùng thao tác.

---

### PHASE 05: VIỆN PHÍ, HÓA ĐƠN & GIAO DỊCH THANH TOÁN (BILLING & PAYMENTS)
- **Mục tiêu**: Xây dựng phân hệ Thu ngân hoàn chỉnh, tự động kết chuyển chi phí khám, xét nghiệm và thuốc thành hóa đơn, hỗ trợ đa phương thức thanh toán.
- **Phụ thuộc**: Hoàn thành Phase 04.
- **Nội dung công việc**:
  - *Database*: Flyway script `V5__init_billing_payments.sql` (bảng `invoices`, `invoice_items`, `payments`, `refunds`).
  - *Backend*:
    - Tự động sinh hóa đơn từ lượt khám và đơn thuốc hoàn tất.
    - Quản lý trạng thái hóa đơn (`PENDING`, `PARTIALLY_PAID`, `PAID`, `CANCELLED`).
    - API ghi nhận thanh toán với `idempotency_key` chống trùng lặp.
    - Quy trình hoàn tiền (`refunds`) có kiểm duyệt.
    - Báo cáo doanh thu theo ca làm việc, phương thức thanh toán.
  - *Frontend*:
    - Màn hình Thu ngân: Tìm kiếm hóa đơn, xem bảng kê chi phí chi tiết.
    - Popup xác nhận thanh toán (Tiền mặt, QR Chuyển khoản, POS Thẻ).
    - Mẫu in Phiếu thu / Biên lai thanh toán đạt chuẩn y tế.
    - Màn hình Báo cáo tài chính, biểu đồ doanh thu theo ngày/tháng (Recharts).
- **Tiêu chuẩn hoàn thành (DoD)**: Thu ngân thanh toán thành công, in biên lai, trạng thái hóa đơn cập nhật mở khóa cho dược sĩ cấp thuốc.

---

### PHASE 06: CỔNG THÔNG TIN BỆNH NHÂN (PATIENT PORTAL) & THÔNG BÁO
- **Mục tiêu**: Cung cấp giao diện tự phục vụ cho người bệnh (đặt lịch online, tra cứu hồ sơ khám, đơn thuốc, lịch sử thanh toán).
- **Phụ thuộc**: Hoàn thành Phase 05.
- **Nội dung công việc**:
  - *Database*: Flyway script `V6__init_notifications.sql` (bảng `notifications`).
  - *Backend*:
    - API riêng cho Portal với kiểm tra quyền sở hữu nghiêm ngặt (`PATIENT:READ_SELF`).
    - Event listener phát sinh thông báo khi lịch hẹn được duyệt, có kết quả xét nghiệm, đơn thuốc hoàn thành.
  - *Frontend*:
    - Cổng giao diện Portal tối ưu hiển thị Mobile/Tablet và Desktop.
    - Trang Đặt lịch hẹn khám bệnh trực quan (chọn chuyên khoa, bác sĩ, khung giờ).
    - Trang Timeline Lịch sử khám bệnh cá nhân & Đơn thuốc có hướng dẫn uống.
    - Tra cứu hóa đơn và xem biên lai điện tử.
- **Tiêu chuẩn hoàn thành (DoD)**: Bệnh nhân đăng nhập, đặt lịch hẹn online thành công, xem được đơn thuốc của mình mà không lộ dữ liệu người khác.

---

### PHASE 07: KIỂM THỬ TỔNG THỂ, BẢO MẬT & ĐÓNG GÓI TRIỂN KHAI (HARDENING & PACKAGING)
- **Mục tiêu**: Kiểm thử tích hợp chu trình hoàn chỉnh (End-to-End), kiểm tra bảo mật (Pen-testing, SQLi, XSS, RBAC bypass), tối ưu hóa chỉ mục DB và đóng gói chạy trên Windows.
- **Phụ thuộc**: Hoàn thành Phase 06.
- **Nội dung công việc**:
  - Chạy toàn bộ Test Suites (Unit Test, Integration Test, Security Test).
  - Tối ưu hóa Database queries, kiểm tra `EXPLAIN` trên các truy vấn lớn.
  - Đóng gói Backend thành JAR thực thi (`java -jar clinic-management.jar`).
  - Build Frontend thành bản phân phối tĩnh (`npm run build` -> `dist/`).
  - Cấu hình file chạy dịch vụ trên Windows Server / Windows Desktop.
- **Tiêu chuẩn hoàn thành (DoD)**: Hệ thống vượt qua 100% test cases, không có lỗ hổng bảo mật nghiêm trọng, sẵn sàng bàn giao vận hành.
