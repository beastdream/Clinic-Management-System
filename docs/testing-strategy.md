# CHIẾN LƯỢC KIỂM THỬ HỆ THỐNG (TESTING-STRATEGY.MD)

> **Mục tiêu**: Đảm bảo tính toàn vẹn dữ liệu lâm sàng, độ chính xác tuyệt đối của giao dịch tài chính, an toàn tồn kho và tính bất khả xâm phạm của hồ sơ bệnh án.  
> **Phiên bản**: 1.0.0 | Ngày lập: 2026-10-15

---

## 1. THÁP KIỂM THỬ (TESTING PYRAMID)

Hệ thống áp dụng mô hình kim tự tháp kiểm thử đa tầng:

```
          / \
         /   \
        / E2E \       <-- Kiểm thử chu trình khám bệnh hoàn chỉnh (End-to-End)
       /-------\
      / Security\     <-- Kiểm thử RBAC, IDOR, Chống Admin đọc bệnh án
     /-----------\
    / Integration \   <-- Kiểm thử Spring Data JPA, Giao dịch Kho & Thanh toán
   /---------------\
  /    Unit Tests   \ <-- Tính tiền hóa đơn, Thuật toán FEFO, Máy trạng thái
 /-------------------\
```

---

## 2. CHI TIẾT CHIẾN LƯỢC KIỂM THỬ BACKEND

### 2.1. Công nghệ & Framework
- **Unit & Integration Test**: JUnit 5, Mockito, AssertJ.
- **Tầng Web/API**: Spring MVC Test (`MockMvc`), `@WithMockUser`, `@WithUserDetails`.
- **Database Testing**: Spring Boot Test với profile kiểm thử (`application-test.yml`), sử dụng MySQL test container hoặc database test cô lập để đảm bảo tương thích 100% cú pháp và hàm của MySQL 8.4 LTS.

### 2.2. Các kịch bản Kiểm thử Nghiệp vụ Trọng yếu (Critical Test Scenarios)

#### Kịch bản 1: Thuật toán Xuất kho Thuốc theo Hạn dùng (FEFO Engine Test)
- **Mục tiêu**: Đảm bảo thuốc có hạn dùng gần nhất luôn được xuất trước; tự động chuyển sang lô tiếp theo nếu lô đầu không đủ; bỏ qua các lô đã hết hạn (`EXPIRED`) hoặc bị thu hồi (`RECALLED`).
- **Test Case Chi tiết**:
  - `test_FEFO_SingleBatch_SufficientStock`: Xuất 10 viên từ Lô A (còn 50 viên, HSD 2026-12) -> Thành công, số lượng còn 40.
  - `test_FEFO_MultipleBatches_CrossBatchDeduction`: Yêu cầu 30 viên. Lô 1 (HSD 2026-11) còn 10 viên, Lô 2 (HSD 2027-01) còn 50 viên -> Lô 1 còn 0 (chuyển `DEPLETED`), Lô 2 còn 30, ghi nhận 2 bản ghi `prescription_dispensations`.
  - `test_FEFO_SkipExpiredBatches`: Lô có HSD nhỏ hơn ngày hiện tại không được phép xuất.
  - `test_FEFO_InsufficientTotalStock`: Tổng tồn kho các lô nhỏ hơn số lượng yêu cầu -> Phải rollback toàn bộ giao dịch, ném ngoại lệ `InsufficientStockException`, không trừ dở dang bất kỳ lô nào.

#### Kịch bản 2: Độ chính xác Tính toán Tài chính & Tiền tệ (Financial Accuracy Test)
- **Mục tiêu**: Không để xảy ra sai số làm tròn số thực (`floating-point error`); tổng hóa đơn phải khớp chính xác đến từng đồng VNĐ.
- **Test Case Chi tiết**:
  - `test_InvoiceCalculation_NoRoundingError`: Kiểm tra phép tính: `total_service_amount + total_medicine_amount - discount_amount == final_amount`.
  - `test_Payment_PartialAndFull`: Hóa đơn 500.000 VNĐ. Lần 1 trả 200.000 VNĐ -> Trạng thái `PARTIALLY_PAID`, `balance_due` = 300.000 VNĐ. Lần 2 trả 300.000 VNĐ -> Trạng thái `PAID`, `balance_due` = 0 VNĐ.
  - `test_Payment_Idempotency`: Gửi cùng một `idempotency_key` 2 lần liên tiếp -> Request thứ hai không được tạo giao dịch mới, phải trả về kết quả của giao dịch trước hoặc lỗi `DuplicateTransactionException`.

#### Kịch bản 3: Máy trạng thái và Kiểm tra Chuyển trạng thái Hợp lệ (State Transition Test)
- **Mục tiêu**: Ngăn chặn nhảy cóc trạng thái bất hợp pháp.
- **Test Case Chi tiết**:
  - Lịch hẹn `PENDING` -> `CHECKED_IN` (Phải qua `CONFIRMED` hoặc qua bước xác thực tiếp tân).
  - Lượt khám `COMPLETED` -> Thử gọi API cập nhật chẩn đoán -> Phải bị chặn với lỗi `IllegalStateTransitionException`.
  - Đơn thuốc chưa thanh toán (`INVOICE_PENDING`) -> Dược sĩ gọi xuất kho -> Bị chặn với lỗi `PrescriptionNotPaidException`.

---

## 3. CHIẾN LƯỢC KIỂM THỬ BẢO MẬT & PHÂN QUYỀN (SECURITY & RBAC TESTING)

### 3.1. Kiểm thử Rào cản Bệnh án đối với Admin (`AdminClinicalPrivacyTest`)
```java
@Test
@WithMockUser(username = "admin_user", roles = {"ADMIN"})
void admin_cannot_access_clinical_encounter_details() throws Exception {
    mockMvc.perform(get("/api/v1/clinical/encounters/101"))
           .andExpect(status().isForbidden());
}
```

### 3.2. Kiểm thử Quyền sở hữu Dữ liệu Bệnh nhân (IDOR / Ownership Test)
```java
@Test
@WithMockUser(username = "patient_a", roles = {"PATIENT"})
void patient_cannot_access_other_patient_medical_record() throws Exception {
    // Patient A (ID: 1) cố gắng truy cập bệnh án của Patient B (ID: 2)
    mockMvc.perform(get("/api/v1/clinical/encounters/by-patient/2"))
           .andExpect(status().isForbidden());
}
```

### 3.3. Kiểm thử Chống Tấn công Dò Mật khẩu (Brute-Force Lockout Test)
- Thực hiện 5 lần gửi mật khẩu sai liên tiếp đến `/api/v1/auth/login`.
- Lần thứ 6 gửi mật khẩu ĐÚNG -> Hệ thống vẫn phải từ chối với thông báo "Tài khoản tạm thời bị khóa do đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút."

---

## 4. CHIẾN LƯỢC KIỂM THỬ ĐỒNG THỜI (CONCURRENCY TESTING)

- **Mục tiêu**: Đảm bảo không xảy ra hiện tượng bán âm kho (Overselling) khi nhiều quầy hoặc người dùng cùng thao tác đồng thời.
- **Phương pháp**: Sử dụng `ExecutorService` hoặc `CountDownLatch` trong JUnit để kích hoạt đồng thời 20 luồng cố gắng xuất 1 lô thuốc chỉ còn 5 đơn vị.
- **Kết quả kỳ vọng**: Đúng 5 đơn vị được xuất thành công, 15 luồng còn lại nhận lỗi hết hàng. Số lượng tồn kho cuối cùng trong DB phải bằng chính xác 0, không được âm.

---

## 5. NGUYÊN TẮC DỮ LIỆU KIỂM THỬ (SYNTHETIC TEST DATA)

1. **Tuyệt đối không dùng dữ liệu thật**: 100% dữ liệu dùng cho Unit test, Integration test và Demo seeding được sinh bằng thư viện giả lập (như Java Faker / Datafaker).
2. Tên bệnh nhân giả lập: "Nguyễn Văn Test A", "Trần Thị Demo B", mã CCCD ngẫu nhiên `001099xxxxxx`.
3. Thông tin thuốc: Dùng tên thuốc mẫu từ Dược điển công khai (Paracetamol 500mg, Amoxicillin 500mg, v.v.).
