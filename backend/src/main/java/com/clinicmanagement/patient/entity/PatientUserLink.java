package com.clinicmanagement.patient.entity;

import com.clinicmanagement.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "patient_user_links")
public class PatientUserLink extends BaseEntity {

    @Column(name = "patient_id", columnDefinition = "CHAR(36)", nullable = false, unique = true)
    private String patientId;

    @Column(name = "user_id", columnDefinition = "CHAR(36)", nullable = false, unique = true)
    private String userId;

    @Column(name = "linked_at", nullable = false)
    private Instant linkedAt = Instant.now();

    @Column(name = "status", length = 20, nullable = false)
    private String status = "ACTIVE";

    public PatientUserLink() {
    }

    public String getPatientId() {
        return patientId;
    }

    public void setPatientId(String patientId) {
        this.patientId = patientId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public Instant getLinkedAt() {
        return linkedAt;
    }

    public void setLinkedAt(Instant linkedAt) {
        this.linkedAt = linkedAt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
