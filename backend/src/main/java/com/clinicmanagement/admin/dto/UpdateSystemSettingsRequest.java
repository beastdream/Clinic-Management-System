package com.clinicmanagement.admin.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record UpdateSystemSettingsRequest(
        @Min(value = 1, message = "Số lần đăng nhập sai tối thiểu là 1")
        @Max(value = 20, message = "Số lần đăng nhập sai tối đa là 20")
        Integer maxFailedLoginAttempts,

        @Min(value = 1, message = "Thời gian khóa tối thiểu là 1 phút")
        @Max(value = 1440, message = "Thời gian khóa tối đa là 1440 phút (24h)")
        Integer lockoutDurationMinutes,

        @Min(value = 6, message = "Độ dài mật khẩu tối thiểu là 6 ký tự")
        @Max(value = 32, message = "Độ dài mật khẩu tối đa là 32 ký tự")
        Integer passwordMinLength,

        Boolean maintenanceMode,

        @Size(max = 255, message = "Thông báo bảo trì tối đa 255 ký tự")
        String maintenanceMessage,

        Boolean allowPatientRegistration
) {
}

