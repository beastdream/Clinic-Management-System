package com.clinicmanagement.admin.controller;

import com.clinicmanagement.admin.dto.*;
import com.clinicmanagement.admin.service.AdminUserService;
import com.clinicmanagement.admin.service.SystemSettingService;
import com.clinicmanagement.common.response.ApiResponse;
import com.clinicmanagement.security.SecurityContextHelper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Settings & User Management", description = "Các API dành riêng cho Quản trị viên quản lý cấu hình hệ thống và toàn bộ tài khoản người dùng")
public class AdminSettingsController {

    private final SystemSettingService systemSettingService;
    private final AdminUserService adminUserService;

    public AdminSettingsController(SystemSettingService systemSettingService, AdminUserService adminUserService) {
        this.systemSettingService = systemSettingService;
        this.adminUserService = adminUserService;
    }

    @GetMapping("/settings")
    @Operation(summary = "Lấy cấu hình hệ thống hiện tại")
    public ResponseEntity<ApiResponse<SystemSettingsDto>> getSettings() {
        return ResponseEntity.ok(ApiResponse.success("Lấy cấu hình hệ thống thành công", systemSettingService.getSettings()));
    }

    @PutMapping("/settings")
    @Operation(summary = "Cập nhật cấu hình hệ thống (ngưỡng đăng nhập sai, thời gian khóa, bảo trì)")
    public ResponseEntity<ApiResponse<SystemSettingsDto>> updateSettings(@Valid @RequestBody UpdateSystemSettingsRequest request) {
        String adminUserId = SecurityContextHelper.getCurrentUserId().orElse(null);
        String adminUsername = SecurityContextHelper.getCurrentUsername().orElse("admin");
        SystemSettingsDto updated = systemSettingService.updateSettings(request, adminUserId, adminUsername);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật cấu hình hệ thống thành công", updated));
    }

    @GetMapping("/users")
    @Operation(summary = "Lấy danh sách toàn bộ tài khoản người dùng")
    public ResponseEntity<ApiResponse<List<AdminUserResponse>>> getAllUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String role
    ) {
        List<AdminUserResponse> users = adminUserService.getAllUsers(search, status, role);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách người dùng thành công", users));
    }

    @PostMapping("/users/{userId}/unlock")
    @Operation(summary = "Mở khóa tài khoản ngay lập tức")
    public ResponseEntity<ApiResponse<AdminUserResponse>> unlockUser(@PathVariable String userId) {
        String adminUserId = SecurityContextHelper.getCurrentUserId().orElse(null);
        String adminUsername = SecurityContextHelper.getCurrentUsername().orElse("admin");
        AdminUserResponse response = adminUserService.unlockUser(userId, adminUserId, adminUsername);
        return ResponseEntity.ok(ApiResponse.success("Mở khóa tài khoản thành công", response));
    }

    @PutMapping("/users/{userId}/status")
    @Operation(summary = "Cập nhật trạng thái tài khoản (ACTIVE, LOCKED, SUSPENDED)")
    public ResponseEntity<ApiResponse<AdminUserResponse>> updateUserStatus(
            @PathVariable String userId,
            @Valid @RequestBody UpdateUserStatusRequest request
    ) {
        String adminUserId = SecurityContextHelper.getCurrentUserId().orElse(null);
        String adminUsername = SecurityContextHelper.getCurrentUsername().orElse("admin");
        AdminUserResponse response = adminUserService.updateUserStatus(userId, request, adminUserId, adminUsername);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái tài khoản thành công", response));
    }

    @PostMapping("/users/{userId}/reset-password")
    @Operation(summary = "Đặt lại mật khẩu cho tài khoản người dùng")
    public ResponseEntity<ApiResponse<Void>> resetUserPassword(
            @PathVariable String userId,
            @Valid @RequestBody AdminResetPasswordRequest request
    ) {
        String adminUserId = SecurityContextHelper.getCurrentUserId().orElse(null);
        String adminUsername = SecurityContextHelper.getCurrentUsername().orElse("admin");
        adminUserService.resetUserPassword(userId, request, adminUserId, adminUsername);
        return ResponseEntity.ok(ApiResponse.success("Đặt lại mật khẩu tài khoản thành công", null));
    }
}

