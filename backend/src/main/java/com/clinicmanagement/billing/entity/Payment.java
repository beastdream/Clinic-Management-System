package com.clinicmanagement.billing.entity;

import com.clinicmanagement.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.math.BigDecimal;

@Entity
@Table(name = "payments")
public class Payment extends BaseEntity {

    @Column(name = "payment_code", length = 30, nullable = false, unique = true)
    private String paymentCode;

    @Column(name = "invoice_id", columnDefinition = "CHAR(36)", nullable = false)
    private String invoiceId;

    @Column(name = "amount", precision = 15, scale = 2, nullable = false)
    private BigDecimal amount = BigDecimal.ZERO;

    @Column(name = "payment_method", length = 30, nullable = false)
    private String paymentMethod; // CASH, BANK_TRANSFER

    @Column(name = "transaction_reference", length = 100)
    private String transactionReference;

    @Column(name = "cashier_id", columnDefinition = "CHAR(36)")
    private String cashierId;

    @Column(name = "status", length = 20, nullable = false)
    private String status = "SUCCESS"; // SUCCESS, REFUNDED

    @Column(name = "notes")
    private String notes;

    public Payment() {
    }

    public String getPaymentCode() {
        return paymentCode;
    }

    public void setPaymentCode(String paymentCode) {
        this.paymentCode = paymentCode;
    }

    public String getInvoiceId() {
        return invoiceId;
    }

    public void setInvoiceId(String invoiceId) {
        this.invoiceId = invoiceId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
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

    public String getCashierId() {
        return cashierId;
    }

    public void setCashierId(String cashierId) {
        this.cashierId = cashierId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}

