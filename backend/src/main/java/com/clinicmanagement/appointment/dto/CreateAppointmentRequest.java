package com.clinicmanagement.appointment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public class CreateAppointmentRequest {

    @NotBlank(message = "Bệnh nhân không được để trống")
    private String patientId;

    private String doctorId;

    @NotBlank(message = "Chuyên khoa khám không được để trống")
    private String specialtyId;

    private String roomId;

    @NotNull(message = "Ngày khám không được để trống")
    private LocalDate appointmentDate;

    @NotNull(message = "Giờ hẹn khám không được để trống")
    private LocalTime appointmentTime;

    private String shift = "MORNING"; // MORNING, AFTERNOON, EVENING
    private String reason;
    private String appointmentType = "WALK_IN"; // WALK_IN, ONLINE_PORTAL, PHONE

    public CreateAppointmentRequest() {
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
}

