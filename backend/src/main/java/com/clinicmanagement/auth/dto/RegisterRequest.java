package com.clinicmanagement.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * Yêu cầu bệnh nhân tự đăng ký tài khoản cổng thông tin (Patient Portal).
 * Tài khoản nhân viên do ADMIN cấp, không đăng ký qua API này.
 */
public record RegisterRequest(
        @NotBlank(message = "Tên đăng nhập không được để trống")
        @Pattern(regexp = "^[a-zA-Z0-9._]{4,50}$",
                message = "Tên đăng nhập gồm 4-50 ký tự: chữ cái không dấu, số, dấu chấm hoặc gạch dưới")
        String username,

        @NotBlank(message = "Mật khẩu không được để trống")
        @Size(min = 8, max = 72, message = "Mật khẩu phải từ 8 đến 72 ký tự")
        @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).+$",
                message = "Mật khẩu phải gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt")
        String password,

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
        String phone,

        @NotBlank(message = "Email không được để trống (dùng để xác thực tài khoản)")
        @Email(message = "Email không đúng định dạng")
        @Size(max = 100, message = "Email tối đa 100 ký tự")
        String email
) {
}
