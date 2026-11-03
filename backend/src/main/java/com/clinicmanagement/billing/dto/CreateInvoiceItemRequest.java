package com.clinicmanagement.billing.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public class CreateInvoiceItemRequest {

    @NotBlank(message = "Mã dịch vụ không được để trống")
    private String serviceId;

    @Min(value = 1, message = "Số lượng dịch vụ tối thiểu là 1")
    private int quantity = 1;

    public CreateInvoiceItemRequest() {
    }

    public CreateInvoiceItemRequest(String serviceId, int quantity) {
        this.serviceId = serviceId;
        this.quantity = quantity;
    }

    public String getServiceId() {
        return serviceId;
    }

    public void setServiceId(String serviceId) {
        this.serviceId = serviceId;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }
}

