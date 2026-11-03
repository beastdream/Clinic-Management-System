package com.clinicmanagement.billing.controller;

import com.clinicmanagement.billing.dto.*;
import com.clinicmanagement.billing.service.InvoiceService;
import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.common.exception.ErrorCode;
import com.clinicmanagement.common.response.ApiResponse;
import com.clinicmanagement.common.response.PageResponse;
import com.clinicmanagement.security.SecurityContextHelper;
import com.clinicmanagement.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/billing/invoices")
@Tag(name = "Billing & Invoices Management", description = "Các API quản lý hóa đơn viện phí, tính toán chi phí, thanh toán tiền mặt/chuyển khoản và báo cáo doanh thu")
public class InvoiceController {

    private final InvoiceService invoiceService;

    public InvoiceController(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    @GetMapping("/services")
    @PreAuthorize("hasAnyRole('CASHIER', 'ADMIN', 'RECEPTIONIST')")
    @Operation(summary = "Lấy danh mục dịch vụ kèm đơn giá", description = "Trả về danh sách dịch vụ y tế kèm đơn giá hiện hành để lập hóa đơn")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAvailableServices() {
        List<Map<String, Object>> services = invoiceService.getAvailableServicesWithPrices();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh mục dịch vụ kèm đơn giá thành công", services));
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('CASHIER', 'ADMIN', 'RECEPTIONIST')")
    @Operation(summary = "Thống kê tổng hợp doanh thu viện phí", description = "Trả về tổng doanh thu đã thanh toán, tiền chờ thu và số lượng hóa đơn theo trạng thái")
    public ResponseEntity<ApiResponse<BillingSummaryResponse>> getBillingSummary() {
        BillingSummaryResponse summary = invoiceService.getBillingSummary();
        return ResponseEntity.ok(ApiResponse.success("Lấy thống kê viện phí thành công", summary));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('CASHIER', 'ADMIN', 'RECEPTIONIST')")
    @Operation(summary = "Tạo mới hóa đơn viện phí", description = "Tạo hóa đơn cho bệnh nhân hoặc lượt khám, tính tổng tiền tự động từ cơ sở dữ liệu")
    public ResponseEntity<ApiResponse<InvoiceResponse>> createInvoice(@Valid @RequestBody CreateInvoiceRequest request) {
        String currentUserId = SecurityContextHelper.getCurrentUserId()
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
        InvoiceResponse response = invoiceService.createInvoice(request, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo hóa đơn viện phí thành công", response));
    }

    @PostMapping("/{id}/pay")
    @PreAuthorize("hasAnyRole('CASHIER', 'ADMIN', 'RECEPTIONIST')")
    @Operation(summary = "Ghi nhận thanh toán hóa đơn", description = "Thanh toán hóa đơn bằng tiền mặt hoặc chuyển khoản mô phỏng, chống thanh toán trùng")
    public ResponseEntity<ApiResponse<InvoiceResponse>> payInvoice(
            @PathVariable String id,
            @Valid @RequestBody PayInvoiceRequest request
    ) {
        String currentUserId = SecurityContextHelper.getCurrentUserId()
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
        InvoiceResponse response = invoiceService.payInvoice(id, request, currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Xác nhận thanh toán hóa đơn thành công", response));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('CASHIER', 'ADMIN')")
    @Operation(summary = "Hủy hóa đơn viện phí", description = "Hủy hóa đơn ở trạng thái UNPAID, hóa đơn hủy không được tính vào doanh thu")
    public ResponseEntity<ApiResponse<InvoiceResponse>> cancelInvoice(
            @PathVariable String id,
            @Valid @RequestBody CancelInvoiceRequest request
    ) {
        String currentUserId = SecurityContextHelper.getCurrentUserId()
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
        InvoiceResponse response = invoiceService.cancelInvoice(id, request, currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Hủy hóa đơn viện phí thành công", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('CASHIER', 'ADMIN', 'RECEPTIONIST', 'PATIENT')")
    @Operation(summary = "Xem chi tiết hóa đơn viện phí", description = "Xem chi tiết hóa đơn kèm bảng kê dịch vụ và lịch sử thanh toán")
    public ResponseEntity<ApiResponse<InvoiceResponse>> getInvoiceById(@PathVariable String id) {
        UserPrincipal currentUser = SecurityContextHelper.getCurrentUser()
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
        InvoiceResponse response = invoiceService.getInvoiceById(id, currentUser.getId(), currentUser.getRoles());
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin chi tiết hóa đơn thành công", response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('CASHIER', 'ADMIN', 'RECEPTIONIST', 'PATIENT')")
    @Operation(summary = "Tìm kiếm và phân trang hóa đơn viện phí", description = "Danh sách hóa đơn lọc theo trạng thái, khoảng ngày và từ khóa tìm kiếm")
    public ResponseEntity<ApiResponse<PageResponse<InvoiceResponse>>> searchInvoices(
            @RequestParam(required = false) String patientId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        UserPrincipal currentUser = SecurityContextHelper.getCurrentUser()
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        PageResponse<InvoiceResponse> response = invoiceService.searchInvoices(
                patientId, status, fromDate, toDate, search, pageRequest, currentUser.getId(), currentUser.getRoles()
        );
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách hóa đơn thành công", response));
    }
}

