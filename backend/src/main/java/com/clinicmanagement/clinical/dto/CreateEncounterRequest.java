package com.clinicmanagement.clinical.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public class CreateEncounterRequest {

    private String appointmentId;

    @NotBlank(message = "Mã định danh bệnh nhân không được để trống")
    private String patientId;

    private String roomId;

    @NotBlank(message = "Triệu chứng chính không được để trống")
    @Size(max = 2000, message = "Triệu chứng chính tối đa 2000 ký tự")
    private String chiefComplaint;

    @Size(max = 4000, message = "Ghi chú thăm khám tối đa 4000 ký tự")
    private String examinationNotes;

    @NotBlank(message = "Chẩn đoán không được để trống")
    @Size(max = 1000, message = "Chẩn đoán tối đa 1000 ký tự")
    private String diagnosis;

    @Size(max = 4000, message = "Hướng xử trí tối đa 4000 ký tự")
    private String treatmentPlan;

    // Vital signs
    private BigDecimal temperature;
    private String bloodPressure;
    private Integer heartRate;
    private Integer respiratoryRate;
    private BigDecimal weight;
    private BigDecimal height;

    public CreateEncounterRequest() {
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

    public String getRoomId() {
        return roomId;
    }

    public void setRoomId(String roomId) {
        this.roomId = roomId;
    }

    public String getChiefComplaint() {
        return chiefComplaint;
    }

    public void setChiefComplaint(String chiefComplaint) {
        this.chiefComplaint = chiefComplaint;
    }

    public String getExaminationNotes() {
        return examinationNotes;
    }

    public void setExaminationNotes(String examinationNotes) {
        this.examinationNotes = examinationNotes;
    }

    public String getDiagnosis() {
        return diagnosis;
    }

    public void setDiagnosis(String diagnosis) {
        this.diagnosis = diagnosis;
    }

    public String getTreatmentPlan() {
        return treatmentPlan;
    }

    public void setTreatmentPlan(String treatmentPlan) {
        this.treatmentPlan = treatmentPlan;
    }

    public BigDecimal getTemperature() {
        return temperature;
    }

    public void setTemperature(BigDecimal temperature) {
        this.temperature = temperature;
    }

    public String getBloodPressure() {
        return bloodPressure;
    }

    public void setBloodPressure(String bloodPressure) {
        this.bloodPressure = bloodPressure;
    }

    public Integer getHeartRate() {
        return heartRate;
    }

    public void setHeartRate(Integer heartRate) {
        this.heartRate = heartRate;
    }

    public Integer getRespiratoryRate() {
        return respiratoryRate;
    }

    public void setRespiratoryRate(Integer respiratoryRate) {
        this.respiratoryRate = respiratoryRate;
    }

    public BigDecimal getWeight() {
        return weight;
    }

    public void setWeight(BigDecimal weight) {
        this.weight = weight;
    }

    public BigDecimal getHeight() {
        return height;
    }

    public void setHeight(BigDecimal height) {
        this.height = height;
    }
}

