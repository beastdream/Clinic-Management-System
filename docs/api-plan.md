# KẾ HOẠCH VÀ DANH MỤC THIẾT KẾ REST API (API-PLAN.MD)

> **Giao thức**: RESTful API qua HTTPS  
> **Định dạng dữ liệu**: JSON (`Content-Type: application/json; charset=UTF-8`)  
> **Quy chuẩn URL**: Chữ thường, phân cách bằng dấu gạch ngang (`kebab-case`), số nhiều cho danh từ tài nguyên  
> **Chuẩn phong bì phản hồi (Response Envelope)**: Cố định cho toàn hệ thống  
> **Phiên bản**: 1.0.0 | Ngày lập: 2026-10-15

---

## 1. QUY CHUẨN ĐẦU VÀO VÀ ĐẦU RA (API CONVENTIONS)

### 1.1. Cấu trúc Response Envelope thành công
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Thao tác thành công",
  "data": { ... },
  "timestamp": "2026-10-15T16:45:00Z"
}
```

### 1.2. Cấu trúc Response Phân trang (Pagination)
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Lấy danh sách thành công",
  "data": {
    "items": [ ... ],
    "page": 0,
    "size": 20,
    "totalElements": 154,
    "totalPages": 8,
    "last": false
  },
  "timestamp": "2026-10-15T16:45:00Z"
}
```

### 1.3. Cấu trúc Response Lỗi chuẩn (RFC 7807 Problem Details)
```json
{
  "success": false,
  "code": "INSUFFICIENT_MEDICINE_STOCK",
  "message": "Số lượng thuốc tồn kho của lô chỉ định không đủ để xuất",
  "details": [
    {
      "field": "quantity",
      "issue": "Yêu cầu 30 đơn vị, nhưng chỉ còn tồn 12 đơn vị"
    }
  ],
  "timestamp": "2026-10-15T16:45:00Z"
}
```

---

## 2. DANH MỤC REST API THEO MODULE

### 2.1. Phân hệ Xác thực & Phân quyền (Auth & Core)

| Phương thức | Đường dẫn URL | Mô tả nghiệp vụ | Quyền hạn (Permissions) |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Đăng nhập hệ thống (nhận JWT & Refresh Token) | Public |
| `POST` | `/api/v1/auth/refresh` | Làm mới Access Token bằng Refresh Token | Public |
| `POST` | `/api/v1/auth/logout` | Đăng xuất và vô hiệu hóa Token | Authenticated |
| `GET` | `/api/v1/auth/me` | Lấy thông tin user hiện tại, roles và permissions | Authenticated |
| `POST` | `/api/v1/auth/change-password` | Đổi mật khẩu cá nhân | Authenticated |
| `GET` | `/api/v1/users` | Danh sách tài khoản người dùng (phân trang, lọc) | `USER:MANAGE` |
| `POST` | `/api/v1/users` | Tạo mới tài khoản nhân viên / phân quyền | `USER:MANAGE` |
| `PUT` | `/api/v1/users/{id}/status` | Khóa / Kích hoạt lại tài khoản | `USER:MANAGE` |
| `GET` | `/api/v1/roles` | Lấy danh mục các vai trò và quyền trong hệ thống | `ROLE_PERMISSION:MANAGE` |

---

### 2.2. Phân hệ Quản trị Cơ sở & Danh mục (Clinic Master Data)

| Phương thức | Đường dẫn URL | Mô tả nghiệp vụ | Quyền hạn |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/clinics` | Lấy thông tin phòng khám / chi nhánh | Authenticated |
| `PUT` | `/api/v1/clinics/{id}` | Cập nhật thông tin phòng khám, logo | `CLINIC_MASTER:MANAGE` |
| `GET` | `/api/v1/specialties` | Danh mục chuyên khoa | Authenticated |
| `POST` | `/api/v1/specialties` | Thêm mới chuyên khoa | `CLINIC_MASTER:MANAGE` |
| `GET` | `/api/v1/rooms` | Danh sách phòng chức năng (khám, xét nghiệm, dược) | Authenticated |
| `POST` | `/api/v1/rooms` | Thêm mới phòng chức năng | `CLINIC_MASTER:MANAGE` |
| `GET` | `/api/v1/services` | Danh mục dịch vụ y tế & bảng giá hiện hành | Authenticated |
| `POST` | `/api/v1/services` | Thêm mới dịch vụ khám / kỹ thuật | `SERVICE_PRICE:MANAGE` |
| `PUT` | `/api/v1/services/{id}/price` | Điều chỉnh giá dịch vụ (lưu lịch sử `price_history`) | `SERVICE_PRICE:MANAGE` |

---

### 2.3. Phân hệ Hồ sơ Bệnh nhân (Patient Domain)

| Phương thức | Đường dẫn URL | Mô tả nghiệp vụ | Quyền hạn |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/patients` | Tìm kiếm bệnh nhân theo tên, CCCD, SĐT, mã BN | `PATIENT:READ_ALL` |
| `POST` | `/api/v1/patients` | Đăng ký hồ sơ bệnh nhân mới tại quầy | `PATIENT:CREATE` |
| `GET` | `/api/v1/patients/{id}` | Xem chi tiết hồ sơ hành chính & tiền sử bệnh | `PATIENT:READ_ALL` hoặc Bệnh nhân sở hữu |
| `PUT` | `/api/v1/patients/{id}` | Cập nhật thông tin hành chính, dị ứng | `PATIENT:UPDATE` |
| `GET` | `/api/v1/portal/profile` | Bệnh nhân xem hồ sơ cá nhân của mình | `PATIENT:READ_SELF` |
| `PUT` | `/api/v1/portal/profile` | Bệnh nhân tự cập nhật thông tin cá nhân | `PATIENT:UPDATE_SELF` |

---

### 2.4. Phân hệ Lịch làm việc, Lịch hẹn & Hàng chờ (Appointment & Queue)

| Phương thức | Đường dẫn URL | Mô tả nghiệp vụ | Quyền hạn |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/schedules` | Xem lịch trực của các bác sĩ theo tuần/tháng | Authenticated |
| `POST` | `/api/v1/schedules` | Thiết lập phân ca trực cho bác sĩ | `CLINIC_MASTER:MANAGE` |
| `GET` | `/api/v1/appointments` | Danh sách lịch hẹn (lọc theo ngày, phòng, trạng thái) | `APPOINTMENT:BOOK` |
| `POST` | `/api/v1/appointments` | Đặt lịch hẹn mới (Tiếp tân đặt hoặc Bác sĩ hẹn lại) | `APPOINTMENT:BOOK` |
| `POST` | `/api/v1/portal/appointments` | Bệnh nhân tự đặt lịch hẹn qua Portal | `APPOINTMENT:BOOK` (`ROLE_PATIENT`) |
| `PUT` | `/api/v1/appointments/{id}/checkin` | Tiếp tân xác nhận check-in bệnh nhân đến quầy | `APPOINTMENT:CHECKIN` |
| `PUT` | `/api/v1/appointments/{id}/cancel` | Hủy lịch hẹn kèm lý do | `APPOINTMENT:CANCEL` |
| `GET` | `/api/v1/queues/rooms/{roomId}` | Lấy hàng chờ thời gian thực của một phòng khám | Authenticated |
| `POST` | `/api/v1/queues/{id}/call` | Bác sĩ gọi số thứ tự tiếp theo vào phòng | `QUEUE:MANAGE` (`ROLE_DOCTOR`) |
| `PUT` | `/api/v1/queues/{id}/skip` | Bác sĩ chuyển trạng thái bệnh nhân vắng mặt (bỏ qua)| `QUEUE:MANAGE` |

---

### 2.5. Phân hệ Thăm khám Lâm sàng & Bệnh án (Clinical Domain)

> **Lưu ý bảo mật**: Tất cả API dưới đây bị CHẶN truy cập đối với `ROLE_ADMIN`.

| Phương thức | Đường dẫn URL | Mô tả nghiệp vụ | Quyền hạn |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/clinical/encounters` | Bắt đầu lượt khám mới (`IN_PROGRESS`) | `ENCOUNTER:CREATE` (`ROLE_DOCTOR`) |
| `GET` | `/api/v1/clinical/encounters/{id}` | Xem chi tiết bệnh án lượt khám | `ENCOUNTER:READ` (Bác sĩ phụ trách hoặc BN) |
| `PUT` | `/api/v1/clinical/encounters/{id}` | Cập nhật quá trình khám lâm sàng, kết luận | `ENCOUNTER:UPDATE` |
| `PUT` | `/api/v1/clinical/encounters/{id}/complete` | Hoàn thành lượt khám & khóa bệnh án | `ENCOUNTER:UPDATE` |
| `POST` | `/api/v1/clinical/encounters/{id}/vitals` | Ghi nhận/cập nhật chỉ số sinh hiệu | `VITALS:RECORD` |
| `POST` | `/api/v1/clinical/encounters/{id}/diagnoses`| Lưu mã chẩn đoán ICD-10 | `DIAGNOSIS:RECORD` |
| `POST` | `/api/v1/clinical/encounters/{id}/orders` | Chỉ định dịch vụ Cận lâm sàng (Xét nghiệm/CĐHA) | `LAB_ORDER:CREATE` |
| `PUT` | `/api/v1/clinical/orders/{orderId}/result` | Kỹ thuật viên nhập kết quả & đính kèm file CLS | `LAB_ORDER:PERFORM` |
| `POST` | `/api/v1/clinical/encounters/{id}/prescriptions` | Bác sĩ tạo và ký phát hành đơn thuốc điện tử | `PRESCRIPTION:CREATE` |
| `GET` | `/api/v1/clinical/prescriptions/{id}` | Xem chi tiết đơn thuốc | `PRESCRIPTION:READ` |

---

### 2.6. Phân hệ Dược phẩm & Quản lý Kho Dược (Pharmacy Domain)

| Phương thức | Đường dẫn URL | Mô tả nghiệp vụ | Quyền hạn |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/pharmacy/medicines` | Tra cứu danh mục thuốc, giá bán, số lượng tồn kho | `MEDICINE:MANAGE` hoặc xem đơn |
| `POST` | `/api/v1/pharmacy/medicines` | Thêm thuốc mới vào danh mục | `MEDICINE:MANAGE` (`ROLE_PHARMACIST`) |
| `GET` | `/api/v1/pharmacy/suppliers` | Quản lý danh sách nhà cung cấp dược | `SUPPLIER:MANAGE` |
| `POST` | `/api/v1/pharmacy/purchase-orders` | Tạo đơn nhập kho dược phẩm theo lô & hạn dùng | `PURCHASE_ORDER:MANAGE` |
| `PUT` | `/api/v1/pharmacy/purchase-orders/{id}/receive` | Xác nhận hoàn thành nhập kho (tăng tồn các lô) | `PURCHASE_ORDER:MANAGE` |
| `GET` | `/api/v1/pharmacy/batches` | Quản lý chi tiết từng lô thuốc, ngày hết hạn | `MEDICINE:MANAGE` |
| `GET` | `/api/v1/pharmacy/batches/alerts/expiring` | Cảnh báo danh sách lô thuốc sắp hết hạn (<= 90 ngày) | `MEDICINE:MANAGE` |
| `POST` | `/api/v1/pharmacy/prescriptions/{id}/dispense`| Dược sĩ xuất kho cấp phát thuốc theo đơn (FEFO) | `INVENTORY:DISPENSE` |
| `POST` | `/api/v1/pharmacy/inventory/adjust` | Cân đối/điều chỉnh kiểm kê tồn kho thủ công | `INVENTORY:ADJUST` (Có ghi log) |

---

### 2.7. Phân hệ Viện phí, Hóa đơn & Thanh toán (Billing Domain)

| Phương thức | Đường dẫn URL | Mô tả nghiệp vụ | Quyền hạn |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/billing/invoices` | Danh sách hóa đơn viện phí (tìm kiếm theo BN, ngày) | `INVOICE:READ` |
| `GET` | `/api/v1/billing/invoices/{id}` | Xem chi tiết các khoản phí dịch vụ và tiền thuốc | `INVOICE:READ` |
| `POST` | `/api/v1/billing/invoices` | Tạo hóa đơn viện phí thủ công tại quầy | `INVOICE:CREATE` |
| `POST` | `/api/v1/billing/invoices/{id}/payments` | Ghi nhận thanh toán (tiền mặt/POS/chuyển khoản) | `INVOICE:PAY` (`ROLE_CASHIER`) |
| `POST` | `/api/v1/billing/payments/{id}/refund` | Thực hiện hoàn tiền cho bệnh nhân | `INVOICE:REFUND` |
| `GET` | `/api/v1/billing/reports/daily-revenue` | Báo cáo doanh thu thu ngân cuối ngày | `FINANCIAL_REPORT:VIEW` |

---

### 2.8. Phân hệ Thông báo & Nhật ký Kiểm toán (Notification & Audit)

| Phương thức | Đường dẫn URL | Mô tả nghiệp vụ | Quyền hạn |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/notifications` | Lấy danh sách thông báo của người dùng hiện tại | Authenticated |
| `PUT` | `/api/v1/notifications/{id}/read` | Đánh dấu thông báo đã đọc | Authenticated |
| `GET` | `/api/v1/audit-logs` | Quản trị viên tra cứu nhật ký kiểm toán hệ thống | `AUDIT_LOG:VIEW` (`ROLE_ADMIN`) |
