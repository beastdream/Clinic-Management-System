package com.clinicmanagement.admin.dto;

public record SystemSettingsDto(
        int maxFailedLoginAttempts,
        int lockoutDurationMinutes,
        int passwordMinLength,
        boolean maintenanceMode,
        String maintenanceMessage,
        boolean allowPatientRegistration
) {
}

