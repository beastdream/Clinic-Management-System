package com.clinicmanagement.clinical.dto;

import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public class UpdateEncounterRequest {

    @Size(max = 2000, message = "Triệu chứng chính tối đa 2000 ký tự")
    private String chiefComplaint;

    @Size(max = 4000, message = "Ghi chú thăm khám tối đa 4000 ký tự")
    private String examinationNotes;

    @Size(max = 1000, message = "Chẩn đoán tối đa 1000 ký tự")
    private String diagnosis;

    @Size(max = 30, message = "Mã ICD-10 tối đa 30 ký tự")
    private String icd10Code;

    private String secondaryDiagnoses;

    @Size(max = 4000, message = "Hướng xử trí tối đa 4000 ký tự")
    private String treatmentPlan;

    private java.time.LocalDate followUpDate;
    private String followUpNotes;

    private BigDecimal temperature;
    private String bloodPressure;
    private Integer heartRate;
    private Integer respiratoryRate;
    private BigDecimal weight;
    private BigDecimal height;

    public UpdateEncounterRequest() {
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

    public String getIcd10Code() {
        return icd10Code;
    }

    public void setIcd10Code(String icd10Code) {
        this.icd10Code = icd10Code;
    }

    public String getSecondaryDiagnoses() {
        return secondaryDiagnoses;
    }

    public void setSecondaryDiagnoses(String secondaryDiagnoses) {
        this.secondaryDiagnoses = secondaryDiagnoses;
    }

    public java.time.LocalDate getFollowUpDate() {
        return followUpDate;
    }

    public void setFollowUpDate(java.time.LocalDate followUpDate) {
        this.followUpDate = followUpDate;
    }

    public String getFollowUpNotes() {
        return followUpNotes;
    }

    public void setFollowUpNotes(String followUpNotes) {
        this.followUpNotes = followUpNotes;
    }
}

