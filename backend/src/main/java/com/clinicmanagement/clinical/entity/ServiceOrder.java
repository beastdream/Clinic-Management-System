package com.clinicmanagement.clinical.entity;

import com.clinicmanagement.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "service_orders")
public class ServiceOrder extends BaseEntity {

    @Column(name = "order_code", length = 30, nullable = false, unique = true)
    private String orderCode;

    @Column(name = "encounter_id", columnDefinition = "CHAR(36)", nullable = false)
    private String encounterId;

    @Column(name = "patient_id", columnDefinition = "CHAR(36)", nullable = false)
    private String patientId;

    @Column(name = "doctor_id", columnDefinition = "CHAR(36)", nullable = false)
    private String doctorId;

    @Column(name = "service_id", columnDefinition = "CHAR(36)", nullable = false)
    private String serviceId;

    @Column(name = "service_name", length = 150, nullable = false)
    private String serviceName;

    @Column(name = "price", precision = 19, scale = 2, nullable = false)
    private BigDecimal price;

    @Column(name = "priority", length = 20, nullable = false)
    private String priority = "ROUTINE"; // ROUTINE, URGENT

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "status", length = 20, nullable = false)
    private String status = "PENDING"; // PENDING, PAID, PROCESSING, COMPLETED, CANCELLED

    @Column(name = "results", columnDefinition = "TEXT")
    private String results;

    @Column(name = "conclusion", columnDefinition = "TEXT")
    private String conclusion;

    @Column(name = "performed_by", columnDefinition = "CHAR(36)")
    private String performedBy;

    @Column(name = "performed_at")
    private LocalDateTime performedAt;

    public ServiceOrder() {
    }

    public String getOrderCode() {
        return orderCode;
    }

    public void setOrderCode(String orderCode) {
        this.orderCode = orderCode;
    }

    public String getEncounterId() {
        return encounterId;
    }

    public void setEncounterId(String encounterId) {
        this.encounterId = encounterId;
    }

    public String getPatientId() {
        return patientId;
    }

    public void setPatientId(String patientId) {
        this.patientId = patientId;
    }

    public String getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(String doctorId) {
        this.doctorId = doctorId;
    }

    public String getServiceId() {
        return serviceId;
    }

    public void setServiceId(String serviceId) {
        this.serviceId = serviceId;
    }

    public String getServiceName() {
        return serviceName;
    }

    public void setServiceName(String serviceName) {
        this.serviceName = serviceName;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getResults() {
        return results;
    }

    public void setResults(String results) {
        this.results = results;
    }

    public String getConclusion() {
        return conclusion;
    }

    public void setConclusion(String conclusion) {
        this.conclusion = conclusion;
    }

    public String getPerformedBy() {
        return performedBy;
    }

    public void setPerformedBy(String performedBy) {
        this.performedBy = performedBy;
    }

    public LocalDateTime getPerformedAt() {
        return performedAt;
    }

    public void setPerformedAt(LocalDateTime performedAt) {
        this.performedAt = performedAt;
    }
}

