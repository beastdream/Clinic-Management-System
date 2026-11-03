package com.clinicmanagement.appointment.entity;

import com.clinicmanagement.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "appointments")
public class Appointment extends BaseEntity {

    @Column(name = "appointment_code", length = 30, nullable = false, unique = true)
    private String appointmentCode;

    @Column(name = "patient_id", columnDefinition = "CHAR(36)", nullable = false)
    private String patientId;

    @Column(name = "doctor_id", columnDefinition = "CHAR(36)")
    private String doctorId;

    @Column(name = "specialty_id", columnDefinition = "CHAR(36)", nullable = false)
    private String specialtyId;

    @Column(name = "room_id", columnDefinition = "CHAR(36)")
    private String roomId;

    @Column(name = "appointment_date", nullable = false)
    private LocalDate appointmentDate;

    @Column(name = "appointment_time", nullable = false)
    private LocalTime appointmentTime;

    @Column(name = "shift", length = 20, nullable = false)
    private String shift = "MORNING"; // MORNING, AFTERNOON, EVENING

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @Column(name = "appointment_type", length = 20, nullable = false)
    private String appointmentType = "WALK_IN"; // WALK_IN, ONLINE_PORTAL, PHONE

    @Column(name = "status", length = 30, nullable = false)
    private String status = "PENDING"; // PENDING, CONFIRMED, CHECKED_IN, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW

    @Column(name = "cancellation_reason")
    private String cancellationReason;

    @Column(name = "created_by", columnDefinition = "CHAR(36)")
    private String createdBy;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    public Appointment() {
    }

    public String getAppointmentCode() {
        return appointmentCode;
    }

    public void setAppointmentCode(String appointmentCode) {
        this.appointmentCode = appointmentCode;
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

    public String getSpecialtyId() {
        return specialtyId;
    }

    public void setSpecialtyId(String specialtyId) {
        this.specialtyId = specialtyId;
    }

    public String getRoomId() {
        return roomId;
    }

    public void setRoomId(String roomId) {
        this.roomId = roomId;
    }

    public LocalDate getAppointmentDate() {
        return appointmentDate;
    }

    public void setAppointmentDate(LocalDate appointmentDate) {
        this.appointmentDate = appointmentDate;
    }

    public LocalTime getAppointmentTime() {
        return appointmentTime;
    }

    public void setAppointmentTime(LocalTime appointmentTime) {
        this.appointmentTime = appointmentTime;
    }

    public String getShift() {
        return shift;
    }

    public void setShift(String shift) {
        this.shift = shift;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getAppointmentType() {
        return appointmentType;
    }

    public void setAppointmentType(String appointmentType) {
        this.appointmentType = appointmentType;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getCancellationReason() {
        return cancellationReason;
    }

    public void setCancellationReason(String cancellationReason) {
        this.cancellationReason = cancellationReason;
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
}

