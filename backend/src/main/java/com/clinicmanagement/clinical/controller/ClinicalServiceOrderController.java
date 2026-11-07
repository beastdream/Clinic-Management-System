package com.clinicmanagement.clinical.controller;

import com.clinicmanagement.clinical.dto.DoctorPillarDtos.CreateServiceOrderRequest;
import com.clinicmanagement.clinical.dto.DoctorPillarDtos.ServiceOrderDto;
import com.clinicmanagement.clinical.dto.DoctorPillarDtos.UpdateServiceOrderResultRequest;
import com.clinicmanagement.clinical.service.ClinicalServiceOrderService;
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
@RequestMapping("/api/v1/clinical/service-orders")
@Tag(name = "Clinical Service Orders", description = "Quản lý chỉ định cận lâm sàng, xét nghiệm và chẩn đoán hình ảnh")
public class ClinicalServiceOrderController {

    private final ClinicalServiceOrderService serviceOrderService;

    public ClinicalServiceOrderController(ClinicalServiceOrderService serviceOrderService) {
        this.serviceOrderService = serviceOrderService;
    }

    @PostMapping
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Bác sĩ chỉ định dịch vụ kỹ thuật / cận lâm sàng cho ca khám")
    public ResponseEntity<ApiResponse<ServiceOrderDto>> createServiceOrder(
            @Valid @RequestBody CreateServiceOrderRequest request
    ) {
        String currentUsername = SecurityContextHelper.getCurrentUsername().orElse("doctor");
        ServiceOrderDto dto = serviceOrderService.createServiceOrder(request, currentUsername);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Chỉ định dịch vụ kỹ thuật thành công", dto));
    }

    @GetMapping("/encounter/{encounterId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'CASHIER', 'ADMIN')")
    @Operation(summary = "Lấy danh sách các chỉ định kỹ thuật của một ca khám")
    public ResponseEntity<ApiResponse<List<ServiceOrderDto>>> getServiceOrdersByEncounterId(
            @PathVariable String encounterId
    ) {
        return ResponseEntity.ok(ApiResponse.success(serviceOrderService.getServiceOrdersByEncounterId(encounterId)));
    }

    @PutMapping("/{orderId}/results")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    @Operation(summary = "Cập nhật kết quả xét nghiệm / chẩn đoán hình ảnh")
    public ResponseEntity<ApiResponse<ServiceOrderDto>> updateServiceOrderResult(
            @PathVariable String orderId,
            @RequestBody UpdateServiceOrderResultRequest request
    ) {
        String currentUsername = SecurityContextHelper.getCurrentUsername().orElse("doctor");
        ServiceOrderDto dto = serviceOrderService.updateServiceOrderResult(orderId, request, currentUsername);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật kết quả thành công", dto));
    }

    @DeleteMapping("/{orderId}")
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Hủy chỉ định dịch vụ kỹ thuật chưa thực hiện")
    public ResponseEntity<ApiResponse<Void>> deleteServiceOrder(@PathVariable String orderId) {
        String currentUsername = SecurityContextHelper.getCurrentUsername().orElse("doctor");
        serviceOrderService.deleteServiceOrder(orderId, currentUsername);
        return ResponseEntity.ok(ApiResponse.success("Hủy chỉ định thành công", null));
    }
}

