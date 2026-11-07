package com.clinicmanagement.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UpdateUserStatusRequest(
        @NotBlank(message = "Trạng thái không được để trống")
        @Pattern(regexp = "^(ACTIVE|LOCKED|SUSPENDED)$", message = "Trạng thái chỉ có thể là ACTIVE, LOCKED hoặc SUSPENDED")
        String status,

        String reason
) {
}

