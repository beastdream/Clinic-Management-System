package com.clinicmanagement.admin.controller;

import com.clinicmanagement.admin.dto.AdminAuditLogDto;
import com.clinicmanagement.admin.service.AdminAuditLogService;
import com.clinicmanagement.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/audit-logs")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Audit Logs", description = "Các API dành riêng cho Quản trị viên theo dõi nhật ký kiểm toán và an toàn dữ liệu")
public class AdminAuditLogController {

    private final AdminAuditLogService auditLogService;

    public AdminAuditLogController(AdminAuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách nhật ký kiểm toán")
    public ResponseEntity<ApiResponse<List<AdminAuditLogDto>>> getAuditLogs(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "150") int limit
    ) {
        return ResponseEntity.ok(ApiResponse.success(auditLogService.getAuditLogs(action, search, limit)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Xem chi tiết một nhật ký kiểm toán")
    public ResponseEntity<ApiResponse<AdminAuditLogDto>> getAuditLogById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(auditLogService.getAuditLogById(id)));
    }
}

