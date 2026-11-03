package com.clinicmanagement.appointment.entity;

import com.clinicmanagement.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "patient_queues")
public class PatientQueue extends BaseEntity {

    @Column(name = "clinic_id", columnDefinition = "CHAR(36)", nullable = false)
    private String clinicId;

    @Column(name = "room_id", columnDefinition = "CHAR(36)", nullable = false)
    private String roomId;

    @Column(name = "appointment_id", columnDefinition = "CHAR(36)")
    private String appointmentId;

    @Column(name = "patient_id", columnDefinition = "CHAR(36)", nullable = false)
    private String patientId;

    @Column(name = "queue_number", nullable = false)
    private int queueNumber;

    @Column(name = "queue_date", nullable = false)
    private LocalDate queueDate;

    @Column(name = "priority", length = 20, nullable = false)
    private String priority = "NORMAL"; // NORMAL, EMERGENCY, ELDERLY, PREGNANT

    @Column(name = "status", length = 20, nullable = false)
    private String status = "WAITING"; // WAITING, CALLING, IN_CONSULTATION, COMPLETED, SKIPPED

    @Column(name = "called_at")
    private Instant calledAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    public PatientQueue() {
    }

    public String getClinicId() {
        return clinicId;
    }

    public void setClinicId(String clinicId) {
        this.clinicId = clinicId;
    }

    public String getRoomId() {
        return roomId;
    }

    public void setRoomId(String roomId) {
        this.roomId = roomId;
    }

    public String getAppointmentId() {
        return appointmentId;
    }

    public void setAppointmentId(String appointmentId) {
        this.appointmentId = appointmentId;
    }

    public String getPatientId() {
        return patientId;
    }

    public void setPatientId(String patientId) {
        this.patientId = patientId;
    }

    public int getQueueNumber() {
        return queueNumber;
    }

    public void setQueueNumber(int queueNumber) {
        this.queueNumber = queueNumber;
    }

    public LocalDate getQueueDate() {
        return queueDate;
    }

    public void setQueueDate(LocalDate queueDate) {
        this.queueDate = queueDate;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getCalledAt() {
        return calledAt;
    }

    public void setCalledAt(Instant calledAt) {
        this.calledAt = calledAt;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(Instant completedAt) {
        this.completedAt = completedAt;
    }
}

