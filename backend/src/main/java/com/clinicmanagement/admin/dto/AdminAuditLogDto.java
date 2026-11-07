package com.clinicmanagement.admin.dto;

import java.time.Instant;

public record AdminAuditLogDto(
        String id,
        String userId,
        String username,
        String roleName,
        String action,
        String entityName,
        String entityId,
        String oldValues,
        String newValues,
        String ipAddress,
        String userAgent,
        Instant createdAt
) {}

