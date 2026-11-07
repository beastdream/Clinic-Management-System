package com.clinicmanagement.admin.controller;

import com.clinicmanagement.admin.dto.MasterDataDtos.*;
import com.clinicmanagement.admin.service.AdminMasterDataService;
import com.clinicmanagement.clinic.entity.Room;
import com.clinicmanagement.clinic.entity.Specialty;
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
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/master")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Master Data Management", description = "Các API dành riêng cho Quản trị viên quản lý Chuyên khoa, Phòng ban và Bảng giá dịch vụ khám")
public class AdminMasterDataController {

    private final AdminMasterDataService masterDataService;

    public AdminMasterDataController(AdminMasterDataService masterDataService) {
        this.masterDataService = masterDataService;
    }

    // ==================== CHUYÊN KHOA ====================
    @GetMapping("/specialties")
    @Operation(summary = "Lấy tất cả chuyên khoa")
    public ResponseEntity<ApiResponse<List<Specialty>>> getAllSpecialties() {
        return ResponseEntity.ok(ApiResponse.success(masterDataService.getAllSpecialties()));
    }

    @PostMapping("/specialties")
    @Operation(summary = "Tạo mới chuyên khoa")
    public ResponseEntity<ApiResponse<Specialty>> createSpecialty(@Valid @RequestBody CreateSpecialtyRequest req) {
        String admin = SecurityContextHelper.getCurrentUsername().orElse("admin");
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo chuyên khoa thành công", masterDataService.createSpecialty(req, admin)));
    }

    @PutMapping("/specialties/{id}")
    @Operation(summary = "Cập nhật chuyên khoa")
    public ResponseEntity<ApiResponse<Specialty>> updateSpecialty(@PathVariable String id, @Valid @RequestBody UpdateSpecialtyRequest req) {
        String admin = SecurityContextHelper.getCurrentUsername().orElse("admin");
        return ResponseEntity.ok(ApiResponse.success("Cập nhật chuyên khoa thành công", masterDataService.updateSpecialty(id, req, admin)));
    }

    @PutMapping("/specialties/{id}/toggle")
    @Operation(summary = "Bật / Tắt trạng thái chuyên khoa")
    public ResponseEntity<ApiResponse<Specialty>> toggleSpecialty(@PathVariable String id) {
        String admin = SecurityContextHelper.getCurrentUsername().orElse("admin");
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái thành công", masterDataService.toggleSpecialty(id, admin)));
    }

    // ==================== PHÒNG KHÁM ====================
    @GetMapping("/rooms")
    @Operation(summary = "Lấy danh sách tất cả phòng khám")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAllRooms() {
        return ResponseEntity.ok(ApiResponse.success(masterDataService.getAllRooms()));
    }

    @PostMapping("/rooms")
    @Operation(summary = "Tạo mới phòng khám / phòng chức năng")
    public ResponseEntity<ApiResponse<Room>> createRoom(@Valid @RequestBody CreateRoomRequest req) {
        String admin = SecurityContextHelper.getCurrentUsername().orElse("admin");
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo phòng khám thành công", masterDataService.createRoom(req, admin)));
    }

    @PutMapping("/rooms/{id}")
    @Operation(summary = "Cập nhật phòng khám")
    public ResponseEntity<ApiResponse<Room>> updateRoom(@PathVariable String id, @Valid @RequestBody UpdateRoomRequest req) {
        String admin = SecurityContextHelper.getCurrentUsername().orElse("admin");
        return ResponseEntity.ok(ApiResponse.success("Cập nhật phòng thành công", masterDataService.updateRoom(id, req, admin)));
    }

    @PutMapping("/rooms/{id}/toggle")
    @Operation(summary = "Bật / Tắt trạng thái phòng")
    public ResponseEntity<ApiResponse<Room>> toggleRoom(@PathVariable String id) {
        String admin = SecurityContextHelper.getCurrentUsername().orElse("admin");
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái thành công", masterDataService.toggleRoom(id, admin)));
    }

    // ==================== DỊCH VỤ & BẢNG GIÁ ====================
    @GetMapping("/services")
    @Operation(summary = "Lấy danh mục dịch vụ kèm giá hiện hành")
    public ResponseEntity<ApiResponse<List<AdminServiceItemDto>>> getAllServices() {
        return ResponseEntity.ok(ApiResponse.success(masterDataService.getAllServices()));
    }

    @PostMapping("/services")
    @Operation(summary = "Tạo mới dịch vụ và bảng giá ban đầu")
    public ResponseEntity<ApiResponse<AdminServiceItemDto>> createService(@Valid @RequestBody CreateServiceItemRequest req) {
        String admin = SecurityContextHelper.getCurrentUsername().orElse("admin");
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo dịch vụ thành công", masterDataService.createService(req, admin)));
    }

    @PutMapping("/services/{id}")
    @Operation(summary = "Cập nhật dịch vụ và điều chỉnh bảng giá")
    public ResponseEntity<ApiResponse<AdminServiceItemDto>> updateService(@PathVariable String id, @Valid @RequestBody UpdateServiceItemRequest req) {
        String admin = SecurityContextHelper.getCurrentUsername().orElse("admin");
        return ResponseEntity.ok(ApiResponse.success("Cập nhật dịch vụ thành công", masterDataService.updateService(id, req, admin)));
    }
}

