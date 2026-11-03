package com.clinicmanagement.billing.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CancelInvoiceRequest {

    @NotBlank(message = "Lý do hủy hóa đơn không được để trống")
    @Size(max = 255, message = "Lý do hủy tối đa 255 ký tự")
    private String cancellationReason;

    public CancelInvoiceRequest() {
    }

    public CancelInvoiceRequest(String cancellationReason) {
        this.cancellationReason = cancellationReason;
    }

    public String getCancellationReason() {
        return cancellationReason;
    }

    public void setCancellationReason(String cancellationReason) {
        this.cancellationReason = cancellationReason;
    }
}

