# MA TRẬN PHÂN QUYỀN VÀ KIỂM SOÁT TRUY CẬP (RBAC-MATRIX.MD)

> **Mô hình**: Role-Based Access Control (RBAC) kết hợp Attribute-Based Access Control (ABAC - Kiểm tra Data Ownership)  
> **6 Vai trò (Roles)**: `ROLE_ADMIN`, `ROLE_RECEPTIONIST`, `ROLE_DOCTOR`, `ROLE_CASHIER`, `ROLE_PHARMACIST`, `ROLE_PATIENT`  
> **Phiên bản**: 1.0.0 | Ngày lập: 2026-10-15

---

## 1. NGUYÊN TẮC PHÂN QUYỀN VÀ TÁCH BIỆT TRÁCH NHIỆM (SEPARATION OF DUTIES)

1. **Nguyên tắc Quyền Tối thiểu (Principle of Least Privilege)**:
   - Mỗi người dùng chỉ được cấp đúng và đủ quyền hạn cần thiết để thực thi nhiệm vụ công việc.
2. **Quyền riêng tư Dữ liệu Bệnh án (Clinical Privacy Rule)**:
   - `ROLE_ADMIN` quản lý hệ thống, danh mục, tài khoản, nhưng **KHÔNG CÓ QUYỀN** xem bệnh án lâm sàng, chẩn đoán, sinh hiệu và đơn thuốc chi tiết của bệnh nhân.
   - Chỉ `ROLE_DOCTOR` trực tiếp thăm khám (hoặc được phân công hội chẩn) và chính bệnh nhân (`ROLE_PATIENT`) mới được xem hồ sơ bệnh án đó.
3. **Tách biệt vai trò Kê đơn - Cấp phát - Thu tiền (Separation of Clinical, Pharmacy & Financial Duties)**:
   - Bác sĩ (`DOCTOR`) chỉ có quyền kê đơn thuốc (`PRESCRIPTION:CREATE`), không được phép tự xuất kho thuốc (`INVENTORY:DISPENSE`) hay tự thu tiền (`INVOICE:PAY`).
   - Dược sĩ (`PHARMACIST`) chỉ xuất kho thuốc theo đơn hợp lệ đã được thu ngân xác nhận thanh toán (hoặc chính sách miễn giảm), không được tự ý sửa liều lượng hoặc chẩn đoán của bác sĩ.
   - Thu ngân (`CASHIER`) thu tiền theo đúng giá dịch vụ/thuốc hệ thống tự động tính, không được tự ý sửa đổi đơn thuốc hay chỉ định cận lâm sàng.
4. **Nhân viên Đa vai trò (Multi-role Staff)**:
   - Nhân viên có thể được gán nhiều vai trò (ví dụ: Tiếp tân kiêm Thu ngân `ROLE_RECEPTIONIST` + `ROLE_CASHIER` tại các phòng khám quy mô vừa).
   - Hệ thống tự động hợp nhất tập quyền (`Set<Permission>`) của tất cả các role mà user sở hữu.

---

## 2. MA TRẬN QUYỀN CHI TIẾT (PERMISSION MATRIX)

Ký hiệu:
- `FULL`: Toàn quyền (Tạo, Đọc, Sửa, Xóa/Hủy)
- `OWN`: Chỉ thực hiện trên dữ liệu do chính mình tạo ra hoặc được phân công phụ trách
- `READ`: Chỉ xem
- `READ_OWN`: Chỉ xem dữ liệu của chính mình (kiểm tra Data Ownership)
- `C/R`: Tạo mới và Đọc (Create/Read)
- `NONE` (`-`): Không có quyền

| Phân hệ / Tài nguyên | Quyền hạn (Permission Code) | ADMIN | RECEPTIONIST | DOCTOR | CASHIER | PHARMACIST | PATIENT |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Quản trị Hệ thống** | `USER:MANAGE` | FULL | - | - | - | - | - |
| | `ROLE_PERMISSION:MANAGE` | FULL | - | - | - | - | - |
| | `AUDIT_LOG:VIEW` | READ | - | - | - | - | - |
| | `SYSTEM_CONFIG:MANAGE` | FULL | - | - | - | - | - |
| **Cơ sở & Danh mục** | `CLINIC_MASTER:MANAGE` | FULL | READ | READ | READ | READ | READ |
| | `SERVICE_PRICE:MANAGE` | FULL | READ | READ | READ | READ | READ |
| **Hồ sơ Bệnh nhân** | `PATIENT:CREATE` | FULL | C/R | C/R | - | - | - |
| | `PATIENT:READ_ALL` | FULL | FULL | FULL | READ | READ | - |
| | `PATIENT:UPDATE` | FULL | FULL | OWN | - | - | - |
| | `PATIENT:READ_SELF` | - | - | - | - | - | READ_OWN |
| | `PATIENT:UPDATE_SELF` | - | - | - | - | - | OWN |
| **Lịch hẹn & Tiếp đón** | `APPOINTMENT:BOOK` | FULL | FULL | C/R | - | - | OWN |
| | `APPOINTMENT:CHECKIN` | FULL | FULL | - | - | - | - |
| | `APPOINTMENT:CANCEL` | FULL | FULL | OWN | - | - | OWN |
| | `QUEUE:MANAGE` | FULL | FULL | OWN | - | - | READ_OWN |
| **Lâm sàng & Bệnh án** | `ENCOUNTER:CREATE` | - | - | FULL | - | - | - |
| | `ENCOUNTER:READ` | - | - | OWN | - | - | READ_OWN |
| | `ENCOUNTER:UPDATE` | - | - | OWN | - | - | - |
| | `VITALS:RECORD` | - | C/R | FULL | - | - | - |
| | `DIAGNOSIS:RECORD` | - | - | FULL | - | - | - |
| | `LAB_ORDER:CREATE` | - | - | FULL | - | - | - |
| | `LAB_ORDER:PERFORM` | - | - | FULL | - | - | - |
| | `PRESCRIPTION:CREATE` | - | - | FULL | - | - | - |
| | `PRESCRIPTION:READ` | - | - | OWN | READ | READ | READ_OWN |
| **Dược & Kho thuốc** | `MEDICINE:MANAGE` | FULL | - | READ | READ | FULL | READ |
| | `SUPPLIER:MANAGE` | FULL | - | - | - | FULL | - |
| | `PURCHASE_ORDER:MANAGE`| FULL | - | - | - | FULL | - |
| | `INVENTORY:DISPENSE` | - | - | - | - | FULL | - |
| | `INVENTORY:ADJUST` | FULL | - | - | - | FULL | - |
| **Viện phí & Thanh toán** | `INVOICE:CREATE` | FULL | C/R | - | FULL | - | - |
| | `INVOICE:READ` | FULL | FULL | OWN | FULL | READ | READ_OWN |
| | `INVOICE:PAY` | FULL | C/R | - | FULL | - | OWN |
| | `INVOICE:REFUND` | FULL | - | - | OWN | - | - |
| | `FINANCIAL_REPORT:VIEW`| FULL | - | - | FULL | - | - |
| **Thông báo** | `NOTIFICATION:READ_SELF` | FULL | FULL | FULL | FULL | FULL | FULL |

---

## 3. QUY TẮC XÁC THỰC QUYỀN SỞ HỮU DỮ LIỆU (DATA OWNERSHIP & ABAC RULES)

Bên cạnh việc kiểm tra Role và Permission thông qua Annotation `@PreAuthorize("hasAuthority('...')")`, tầng Service BẮT BUỘC kiểm tra điều kiện sở hữu dữ liệu thông qua `SecurityContextHelper`:

### 3.1. Đối với Bệnh nhân (`ROLE_PATIENT`)
- **API Hồ sơ cá nhân**: Bệnh nhân chỉ được truy vấn hoặc cập nhật dữ liệu của chính mình:
  ```java
  if (!patient.getUserId().equals(currentUser.getId())) {
      throw new AccessDeniedException("Bạn không có quyền truy cập hồ sơ của bệnh nhân khác");
  }
  ```
- **API Đơn thuốc & Hóa đơn**: Chỉ xem đơn thuốc và hóa đơn gắn liền với `patient_id` tương ứng với tài khoản của mình.

### 3.2. Đối với Bác sĩ (`ROLE_DOCTOR`)
- **API Bệnh án (`Encounter`)**:
  - Bác sĩ chỉ được phép chỉnh sửa nội dung chẩn đoán, sinh hiệu, đơn thuốc của Lượt khám do chính mình phụ trách (`encounter.getDoctorId().equals(currentStaff.getId())`).
  - Khi lượt khám đã chuyển sang trạng thái `COMPLETED` (Đã hoàn thành), khóa chỉnh sửa bệnh án (chỉ cho phép đọc, cấm update). Mọi bổ sung sau đó phải thông qua ghi chú bổ sung (Addendum) có ghi nhận audit log.

### 3.3. Rào chắn Bảo vệ Quyền riêng tư Y tế đối với Admin (`ADMIN_CLINICAL_RESTRICTION`)
- Spring Security cấu hình bảo vệ các endpoint y tế lâm sàng (`/api/v1/clinical/**`):
  ```java
  .requestMatchers("/api/v1/clinical/**")
      .hasAnyRole("DOCTOR", "PATIENT") // ADMIN không được liệt kê tại đây
  ```
- Trong trường hợp thanh tra đặc biệt hoặc sự cố hệ thống cần can thiệp DB, can thiệp phải diễn ra ở cấp độ Database Administrator với biên bản phê duyệt, không thực hiện qua UI ứng dụng thường nhật.

---

## 4. CHIẾN LƯỢC GHI NHẬT KÝ KIỂM TOÁN (AUDIT TRAIL LOGGING)

Mọi thao tác thuộc nhóm nhạy cảm sau BẮT BUỘC phát sinh một bản ghi trong bảng `audit_logs`:
1. Đăng nhập thất bại quá số lần quy định, mở khóa tài khoản người dùng.
2. Thay đổi quyền hoặc vai trò của bất kỳ nhân viên nào.
3. Bác sĩ tra cứu bệnh án của bệnh nhân cũ.
4. Thu ngân thực hiện thao tác hoàn tiền (`REFUND`) hoặc hủy hóa đơn (`CANCEL`).
5. Dược sĩ thực hiện điều chỉnh số lượng tồn kho thủ công (`INVENTORY:ADJUST`).
6. Xuất dữ liệu báo cáo danh sách bệnh nhân hoặc doanh thu ra file Excel/PDF.
