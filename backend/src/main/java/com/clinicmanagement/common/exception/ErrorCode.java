package com.clinicmanagement.common.exception;

import org.springframework.http.HttpStatus;

public enum ErrorCode {

    // Common errors
    INTERNAL_SERVER_ERROR("ERR_INTERNAL", "Đã xảy ra lỗi nội bộ máy chủ", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_REQUEST("ERR_INVALID_REQUEST", "Dữ liệu yêu cầu không hợp lệ", HttpStatus.BAD_REQUEST),
    UNAUTHORIZED("ERR_UNAUTHORIZED", "Yêu cầu xác thực tài khoản", HttpStatus.UNAUTHORIZED),
    FORBIDDEN("ERR_FORBIDDEN", "Bạn không có quyền thực hiện thao tác này", HttpStatus.FORBIDDEN),
    NOT_FOUND("ERR_NOT_FOUND", "Không tìm thấy tài nguyên yêu cầu", HttpStatus.NOT_FOUND),
    CONFLICT("ERR_CONFLICT", "Dữ liệu bị xung đột hoặc đã tồn tại", HttpStatus.CONFLICT),

    // Auth errors
    INVALID_CREDENTIALS("AUTH_INVALID_CREDENTIALS", "Tên đăng nhập hoặc mật khẩu không chính xác", HttpStatus.UNAUTHORIZED),
    ACCOUNT_LOCKED("AUTH_ACCOUNT_LOCKED", "Tài khoản tạm thời bị khóa do đăng nhập sai quá nhiều lần", HttpStatus.FORBIDDEN),
    ACCOUNT_SUSPENDED("AUTH_ACCOUNT_SUSPENDED", "Tài khoản của bạn đã bị ngưng hoạt động", HttpStatus.FORBIDDEN),
    USERNAME_ALREADY_EXISTS("AUTH_USERNAME_EXISTS", "Tên đăng nhập đã được sử dụng", HttpStatus.CONFLICT),
    EMAIL_ALREADY_EXISTS("AUTH_EMAIL_EXISTS", "Email đã được đăng ký cho tài khoản khác", HttpStatus.CONFLICT),
    EMAIL_NOT_VERIFIED("AUTH_EMAIL_NOT_VERIFIED", "Email chưa được xác thực. Vui lòng mở hộp thư và bấm vào liên kết xác thực", HttpStatus.FORBIDDEN),
    VERIFICATION_TOKEN_INVALID("AUTH_VERIFICATION_TOKEN_INVALID", "Liên kết xác thực không hợp lệ hoặc đã được sử dụng", HttpStatus.BAD_REQUEST),
    VERIFICATION_TOKEN_EXPIRED("AUTH_VERIFICATION_TOKEN_EXPIRED", "Liên kết xác thực đã hết hạn, vui lòng yêu cầu gửi lại email", HttpStatus.BAD_REQUEST),
    GOOGLE_LOGIN_DISABLED("AUTH_GOOGLE_DISABLED", "Đăng nhập bằng Google chưa được cấu hình trên hệ thống", HttpStatus.SERVICE_UNAVAILABLE),
    GOOGLE_TOKEN_INVALID("AUTH_GOOGLE_TOKEN_INVALID", "Không xác minh được tài khoản Google, vui lòng thử lại", HttpStatus.UNAUTHORIZED),
    GOOGLE_EMAIL_NOT_VERIFIED("AUTH_GOOGLE_EMAIL_NOT_VERIFIED", "Email của tài khoản Google này chưa được Google xác minh", HttpStatus.FORBIDDEN),
    GOOGLE_STAFF_NOT_ALLOWED("AUTH_GOOGLE_STAFF_NOT_ALLOWED", "Tài khoản nhân viên phải đăng nhập bằng tên đăng nhập và mật khẩu", HttpStatus.FORBIDDEN),
    PASSWORD_LOGIN_NOT_AVAILABLE("AUTH_PASSWORD_LOGIN_NOT_AVAILABLE", "Tài khoản này được tạo bằng Google, vui lòng chọn \"Tiếp tục với Google\"", HttpStatus.BAD_REQUEST),
    TOKEN_EXPIRED("AUTH_TOKEN_EXPIRED", "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại", HttpStatus.UNAUTHORIZED),
    TOKEN_INVALID("AUTH_TOKEN_INVALID", "Mã xác thực không hợp lệ", HttpStatus.UNAUTHORIZED),

    // Clinical Privacy & Ownership errors
    CLINICAL_PRIVACY_RESTRICTION("CLINICAL_PRIVACY_RESTRICTION", "Tài khoản quản trị không có quyền xem trực tiếp hồ sơ bệnh án", HttpStatus.FORBIDDEN),
    DATA_OWNERSHIP_VIOLATION("DATA_OWNERSHIP_VIOLATION", "Bạn chỉ được phép truy cập dữ liệu của chính mình", HttpStatus.FORBIDDEN),

    // Business domain errors
    PATIENT_NOT_FOUND("PATIENT_NOT_FOUND", "Không tìm thấy hồ sơ bệnh nhân", HttpStatus.NOT_FOUND),
    APPOINTMENT_NOT_FOUND("APPOINTMENT_NOT_FOUND", "Không tìm thấy lịch hẹn khám", HttpStatus.NOT_FOUND),
    APPOINTMENT_SLOT_CONFLICT("APPOINTMENT_SLOT_CONFLICT", "Bác sĩ đã có lịch hẹn khác vào khung giờ này", HttpStatus.CONFLICT),
    DOCTOR_NOT_FOUND("DOCTOR_NOT_FOUND", "Không tìm thấy thông tin bác sĩ", HttpStatus.NOT_FOUND),
    ENCOUNTER_NOT_FOUND("ENCOUNTER_NOT_FOUND", "Không tìm thấy thông tin lượt khám", HttpStatus.NOT_FOUND),
    ENCOUNTER_ALREADY_COMPLETED("ENCOUNTER_ALREADY_COMPLETED", "Lượt khám đã hoàn tất và được khóa an toàn, không thể chỉnh sửa", HttpStatus.BAD_REQUEST),
    ENCOUNTER_ALREADY_EXISTS("ENCOUNTER_ALREADY_EXISTS", "Lịch hẹn này đã có lượt khám đang xử lý hoặc hoàn tất", HttpStatus.CONFLICT),
    MEDICINE_NOT_FOUND("MEDICINE_NOT_FOUND", "Không tìm thấy thuốc yêu cầu", HttpStatus.NOT_FOUND),
    INSUFFICIENT_MEDICINE_STOCK("INSUFFICIENT_MEDICINE_STOCK", "Số lượng thuốc tồn kho không đủ để xuất", HttpStatus.BAD_REQUEST),
    // Billing domain errors
    INVOICE_NOT_FOUND("INVOICE_NOT_FOUND", "Không tìm thấy thông tin hóa đơn", HttpStatus.NOT_FOUND),
    INVOICE_ALREADY_PAID("INVOICE_ALREADY_PAID", "Hóa đơn đã được thanh toán trước đó", HttpStatus.BAD_REQUEST),
    INVOICE_ALREADY_CANCELLED("INVOICE_ALREADY_CANCELLED", "Hóa đơn đã bị hủy, không thể thực hiện giao dịch", HttpStatus.BAD_REQUEST),
    INVOICE_CANNOT_BE_CANCELLED("INVOICE_CANNOT_BE_CANCELLED", "Không thể hủy hóa đơn đã thanh toán", HttpStatus.BAD_REQUEST),
    SERVICE_PRICE_NOT_FOUND("SERVICE_PRICE_NOT_FOUND", "Không tìm thấy bảng giá khả dụng cho dịch vụ yêu cầu", HttpStatus.NOT_FOUND),
    INVALID_PAYMENT_AMOUNT("INVALID_PAYMENT_AMOUNT", "Số tiền thanh toán không hợp lệ", HttpStatus.BAD_REQUEST),
    INVALID_STATE_TRANSITION("INVALID_STATE_TRANSITION", "Trạng thái nghiệp vụ chuyển đổi không hợp lệ", HttpStatus.BAD_REQUEST);

    private final String code;
    private final String message;
    private final HttpStatus httpStatus;

    ErrorCode(String code, String message, HttpStatus httpStatus) {
        this.code = code;
        this.message = message;
        this.httpStatus = httpStatus;
    }

    public String getCode() {
        return code;
    }

    public String getMessage() {
        return message;
    }

    public HttpStatus getHttpStatus() {
        return httpStatus;
    }
}
