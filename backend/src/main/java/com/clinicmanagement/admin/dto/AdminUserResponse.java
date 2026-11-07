package com.clinicmanagement.admin.dto;

import java.time.Instant;
import java.util.List;

public record AdminUserResponse(
        String id,
        String username,
        String email,
        String phone,
        String status,
        int failedLoginAttempts,
        Instant lockedUntil,
        boolean isStaff,
        String authProvider,
        List<String> roles,
        String fullName,
        Instant createdAt,
        Instant updatedAt
) {
}

