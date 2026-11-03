package com.clinicmanagement.appointment.dto;

import com.clinicmanagement.appointment.entity.Appointment;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

public class AppointmentResponse {

    private String id;
    private String appointmentCode;
    private String patientId;
    private String patientName;
    private String patientPhone;
    private String doctorId;
    private String doctorName;
    private String specialtyId;
    private String specialtyName;
    private String roomId;
    private String roomName;
    private LocalDate appointmentDate;
    private LocalTime appointmentTime;
    private String shift;
    private String reason;
    private String appointmentType;
    private String status;
    private String cancellationReason;
    private Instant createdAt;

    public AppointmentResponse() {
    }

    public static AppointmentResponse fromEntity(Appointment apt) {
        AppointmentResponse resp = new AppointmentResponse();
        resp.setId(apt.getId());
        resp.setAppointmentCode(apt.getAppointmentCode());
        resp.setPatientId(apt.getPatientId());
        resp.setDoctorId(apt.getDoctorId());
        resp.setSpecialtyId(apt.getSpecialtyId());
        resp.setRoomId(apt.getRoomId());
        resp.setAppointmentDate(apt.getAppointmentDate());
        resp.setAppointmentTime(apt.getAppointmentTime());
        resp.setShift(apt.getShift());
        resp.setReason(apt.getReason());
        resp.setAppointmentType(apt.getAppointmentType());
        resp.setStatus(apt.getStatus());
        resp.setCancellationReason(apt.getCancellationReason());
        resp.setCreatedAt(apt.getCreatedAt());
        return resp;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
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

    public String getPatientName() {
        return patientName;
    }

    public void setPatientName(String patientName) {
        this.patientName = patientName;
    }

    public String getPatientPhone() {
        return patientPhone;
    }

    public void setPatientPhone(String patientPhone) {
        this.patientPhone = patientPhone;
    }

    public String getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(String doctorId) {
        this.doctorId = doctorId;
    }

    public String getDoctorName() {
        return doctorName;
    }

    public void setDoctorName(String doctorName) {
        this.doctorName = doctorName;
    }

    public String getSpecialtyId() {
        return specialtyId;
    }

    public void setSpecialtyId(String specialtyId) {
        this.specialtyId = specialtyId;
    }

    public String getSpecialtyName() {
        return specialtyName;
    }

    public void setSpecialtyName(String specialtyName) {
        this.specialtyName = specialtyName;
    }

    public String getRoomId() {
        return roomId;
    }

    public void setRoomId(String roomId) {
        this.roomId = roomId;
    }

    public String getRoomName() {
        return roomName;
    }

    public void setRoomName(String roomName) {
        this.roomName = roomName;
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

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}

