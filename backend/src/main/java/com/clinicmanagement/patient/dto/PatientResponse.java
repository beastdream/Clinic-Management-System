package com.clinicmanagement.patient.dto;

import com.clinicmanagement.patient.entity.Patient;

import java.time.Instant;
import java.time.LocalDate;

public class PatientResponse {

    private String id;
    private String patientCode;
    private String fullName;
    private LocalDate dateOfBirth;
    private String gender;
    private String phone;
    private String identityCardNo;
    private String email;
    private String address;
    private String emergencyContactName;
    private String emergencyContactPhone;
    private String bloodType;
    private String allergies;
    private String medicalHistorySummary;
    private String status;
    private Instant createdAt;

    public PatientResponse() {
    }

    public static PatientResponse fromEntity(Patient patient) {
        PatientResponse resp = new PatientResponse();
        resp.setId(patient.getId());
        resp.setPatientCode(patient.getPatientCode());
        resp.setFullName(patient.getFullName());
        resp.setDateOfBirth(patient.getDateOfBirth());
        resp.setGender(patient.getGender());
        resp.setPhone(patient.getPhone());
        resp.setIdentityCardNo(patient.getIdentityCardNo());
        resp.setEmail(patient.getEmail());
        resp.setAddress(patient.getAddress());
        resp.setEmergencyContactName(patient.getEmergencyContactName());
        resp.setEmergencyContactPhone(patient.getEmergencyContactPhone());
        resp.setBloodType(patient.getBloodType());
        resp.setAllergies(patient.getAllergies());
        resp.setMedicalHistorySummary(patient.getMedicalHistorySummary());
        resp.setStatus(patient.getStatus());
        resp.setCreatedAt(patient.getCreatedAt());
        return resp;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getPatientCode() {
        return patientCode;
    }

    public void setPatientCode(String patientCode) {
        this.patientCode = patientCode;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public LocalDate getDateOfBirth() {
        return dateOfBirth;
    }

    public void setDateOfBirth(LocalDate dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getIdentityCardNo() {
        return identityCardNo;
    }

    public void setIdentityCardNo(String identityCardNo) {
        this.identityCardNo = identityCardNo;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getEmergencyContactName() {
        return emergencyContactName;
    }

    public void setEmergencyContactName(String emergencyContactName) {
        this.emergencyContactName = emergencyContactName;
    }

    public String getEmergencyContactPhone() {
        return emergencyContactPhone;
    }

    public void setEmergencyContactPhone(String emergencyContactPhone) {
        this.emergencyContactPhone = emergencyContactPhone;
    }

    public String getBloodType() {
        return bloodType;
    }

    public void setBloodType(String bloodType) {
        this.bloodType = bloodType;
    }

    public String getAllergies() {
        return allergies;
    }

    public void setAllergies(String allergies) {
        this.allergies = allergies;
    }

    public String getMedicalHistorySummary() {
        return medicalHistorySummary;
    }

    public void setMedicalHistorySummary(String medicalHistorySummary) {
        this.medicalHistorySummary = medicalHistorySummary;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}

