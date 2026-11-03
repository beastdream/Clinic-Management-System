package com.clinicmanagement.billing.dto;

import java.math.BigDecimal;

public class BillingSummaryResponse {

    private BigDecimal totalPaidRevenue = BigDecimal.ZERO;
    private BigDecimal totalUnpaidAmount = BigDecimal.ZERO;
    private long totalInvoices;
    private long paidInvoicesCount;
    private long unpaidInvoicesCount;
    private long cancelledInvoicesCount;

    public BillingSummaryResponse() {
    }

    public BillingSummaryResponse(
            BigDecimal totalPaidRevenue,
            BigDecimal totalUnpaidAmount,
            long totalInvoices,
            long paidInvoicesCount,
            long unpaidInvoicesCount,
            long cancelledInvoicesCount
    ) {
        this.totalPaidRevenue = totalPaidRevenue;
        this.totalUnpaidAmount = totalUnpaidAmount;
        this.totalInvoices = totalInvoices;
        this.paidInvoicesCount = paidInvoicesCount;
        this.unpaidInvoicesCount = unpaidInvoicesCount;
        this.cancelledInvoicesCount = cancelledInvoicesCount;
    }

    public BigDecimal getTotalPaidRevenue() {
        return totalPaidRevenue;
    }

    public void setTotalPaidRevenue(BigDecimal totalPaidRevenue) {
        this.totalPaidRevenue = totalPaidRevenue;
    }

    public BigDecimal getTotalUnpaidAmount() {
        return totalUnpaidAmount;
    }

    public void setTotalUnpaidAmount(BigDecimal totalUnpaidAmount) {
        this.totalUnpaidAmount = totalUnpaidAmount;
    }

    public long getTotalInvoices() {
        return totalInvoices;
    }

    public void setTotalInvoices(long totalInvoices) {
        this.totalInvoices = totalInvoices;
    }

    public long getPaidInvoicesCount() {
        return paidInvoicesCount;
    }

    public void setPaidInvoicesCount(long paidInvoicesCount) {
        this.paidInvoicesCount = paidInvoicesCount;
    }

    public long getUnpaidInvoicesCount() {
        return unpaidInvoicesCount;
    }

    public void setUnpaidInvoicesCount(long unpaidInvoicesCount) {
        this.unpaidInvoicesCount = unpaidInvoicesCount;
    }

    public long getCancelledInvoicesCount() {
        return cancelledInvoicesCount;
    }

    public void setCancelledInvoicesCount(long cancelledInvoicesCount) {
        this.cancelledInvoicesCount = cancelledInvoicesCount;
    }
}

