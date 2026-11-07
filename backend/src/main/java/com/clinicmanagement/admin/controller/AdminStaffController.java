package com.clinicmanagement.admin.controller;

import com.clinicmanagement.admin.dto.StaffDtos.*;
import com.clinicmanagement.admin.service.AdminStaffService;
import com.clinicmanagement.common.response.ApiResponse;
import com.clinicmanagement.security.SecurityContextHelper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/staff")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Staff Management", description = "Các API dành riêng cho Quản trị viên quản lý nhân sự y tế và phân vai trò đa nhiệm")
public class AdminStaffController {

    private final AdminStaffService staffService;

    public AdminStaffController(AdminStaffService staffService) {
        this.staffService = staffService;
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách toàn bộ nhân sự")
    public ResponseEntity<ApiResponse<List<AdminStaffDto>>> getAllStaff() {
        return ResponseEntity.ok(ApiResponse.success(staffService.getAllStaff()));
    }

    @PostMapping
    @Operation(summary = "Tạo mới nhân viên và cấp tài khoản người dùng")
    public ResponseEntity<ApiResponse<AdminStaffDto>> createStaff(@Valid @RequestBody CreateStaffRequest req) {
        String admin = SecurityContextHelper.getCurrentUsername().orElse("admin");
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Thêm nhân sự mới thành công", staffService.createStaff(req, admin)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật thông tin nhân viên và vai trò")
    public ResponseEntity<ApiResponse<AdminStaffDto>> updateStaff(@PathVariable String id, @Valid @RequestBody UpdateStaffRequest req) {
        String admin = SecurityContextHelper.getCurrentUsername().orElse("admin");
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin nhân sự thành công", staffService.updateStaff(id, req, admin)));
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Cập nhật trạng thái nhân viên (ACTIVE, ON_LEAVE, TERMINATED)")
    public ResponseEntity<ApiResponse<Void>> updateStaffStatus(@PathVariable String id, @RequestParam String status) {
        String admin = SecurityContextHelper.getCurrentUsername().orElse("admin");
        staffService.updateStaffStatus(id, status, admin);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái nhân sự thành công", null));
    }
}

