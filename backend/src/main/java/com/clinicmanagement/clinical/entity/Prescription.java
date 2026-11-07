package com.clinicmanagement.clinical.entity;

import com.clinicmanagement.common.entity.BaseEntity;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "prescriptions")
public class Prescription extends BaseEntity {

    @Column(name = "prescription_code", length = 30, nullable = false, unique = true)
    private String prescriptionCode;

    @Column(name = "encounter_id", columnDefinition = "CHAR(36)", nullable = false)
    private String encounterId;

    @Column(name = "patient_id", columnDefinition = "CHAR(36)", nullable = false)
    private String patientId;

    @Column(name = "doctor_id", columnDefinition = "CHAR(36)", nullable = false)
    private String doctorId;

    @Column(name = "diagnosis", columnDefinition = "TEXT")
    private String diagnosis;

    @Column(name = "advice", columnDefinition = "TEXT")
    private String advice;

    @Column(name = "status", length = 20, nullable = false)
    private String status = "ACTIVE"; // ACTIVE, DISPENSED, CANCELLED

    @Column(name = "created_by", length = 50)
    private String createdBy;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @OneToMany(mappedBy = "prescription", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<PrescriptionItem> items = new ArrayList<>();

    public Prescription() {
    }

    public String getPrescriptionCode() {
        return prescriptionCode;
    }

    public void setPrescriptionCode(String prescriptionCode) {
        this.prescriptionCode = prescriptionCode;
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

    public String getDiagnosis() {
        return diagnosis;
    }

    public void setDiagnosis(String diagnosis) {
        this.diagnosis = diagnosis;
    }

    public String getAdvice() {
        return advice;
    }

    public void setAdvice(String advice) {
        this.advice = advice;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public Instant getDeletedAt() {
        return deletedAt;
    }

    public void setDeletedAt(Instant deletedAt) {
        this.deletedAt = deletedAt;
    }

    public List<PrescriptionItem> getItems() {
        return items;
    }

    public void setItems(List<PrescriptionItem> items) {
        this.items = items;
    }

    public void addItem(PrescriptionItem item) {
        items.add(item);
        item.setPrescription(this);
    }

    public void removeItem(PrescriptionItem item) {
        items.remove(item);
        item.setPrescription(null);
    }
}

