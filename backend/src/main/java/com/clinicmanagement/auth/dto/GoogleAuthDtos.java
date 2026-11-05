package com.clinicmanagement.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/** Các DTO cho đăng nhập Google và xác thực email. */
public final class GoogleAuthDtos {

    private GoogleAuthDtos() {
    }

    /** credential = Google ID token do Google Identity Services trả về ở frontend. */
    public record GoogleLoginRequest(
            @NotBlank(message = "Thiếu thông tin xác thực Google") String credential) {
    }

    /** Hoàn tất hồ sơ bệnh nhân lần đầu đăng nhập bằng Google. */
    public record GoogleRegisterRequest(
            @NotBlank(message = "Thiếu thông tin xác thực Google")
            String credential,

            @NotBlank(message = "Họ và tên không được để trống")
            @Size(max = 100, message = "Họ và tên tối đa 100 ký tự")
            String fullName,

            @NotNull(message = "Ngày sinh không được để trống")
            @Past(message = "Ngày sinh phải là ngày trong quá khứ")
            LocalDate dateOfBirth,

            @NotBlank(message = "Giới tính không được để trống")
            @Pattern(regexp = "^(MALE|FEMALE|OTHER)$", message = "Giới tính không hợp lệ")
            String gender,

            @NotBlank(message = "Số điện thoại không được để trống")
            @Pattern(regexp = "^(0|\\+84)(3|5|7|8|9)\\d{8}$", message = "Số điện thoại di động không hợp lệ")
            String phone) {
    }

    /**
     * Kết quả đăng nhập Google: hoặc có token (auth), hoặc cần bổ sung hồ sơ (profileRequired).
     */
    public record GoogleAuthResult(boolean profileRequired, String email, String fullName, AuthResponse auth) {
        public static GoogleAuthResult loggedIn(AuthResponse auth) {
            return new GoogleAuthResult(false, auth.getEmail(), null, auth);
        }

        public static GoogleAuthResult needsProfile(String email, String fullName) {
            return new GoogleAuthResult(true, email, fullName, null);
        }
    }

    public record VerifyEmailRequest(
            @NotBlank(message = "Thiếu mã xác thực") @Size(max = 200, message = "Mã xác thực không hợp lệ") String token) {
    }

    public record ResendVerificationRequest(
            @NotBlank(message = "Email không được để trống")
            @Email(message = "Email không đúng định dạng")
            String email) {
    }

    public record RegistrationResult(String email, boolean emailVerificationRequired) {
    }

    public record AuthProvidersResponse(boolean googleEnabled, String googleClientId) {
    }
}
