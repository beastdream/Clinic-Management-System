package com.clinicmanagement.billing.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class PayInvoiceRequest {

    @NotBlank(message = "Phương thức thanh toán không được để trống")
    @Pattern(regexp = "^(CASH|BANK_TRANSFER)$", message = "Phương thức thanh toán phải là CASH hoặc BANK_TRANSFER")
    private String paymentMethod;

    private String transactionReference;

    private String notes;

    public PayInvoiceRequest() {
    }

    public PayInvoiceRequest(String paymentMethod, String transactionReference, String notes) {
        this.paymentMethod = paymentMethod;
        this.transactionReference = transactionReference;
        this.notes = notes;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getTransactionReference() {
        return transactionReference;
    }

    public void setTransactionReference(String transactionReference) {
        this.transactionReference = transactionReference;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}

