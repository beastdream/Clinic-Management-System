package com.clinicmanagement.staff.entity;

import com.clinicmanagement.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.time.LocalDate;

@Entity
@Table(name = "staff_profiles")
public class StaffProfile extends BaseEntity {

    @Column(name = "user_id", columnDefinition = "CHAR(36)", nullable = false, unique = true)
    private String userId;

    @Column(name = "staff_code", length = 30, nullable = false, unique = true)
    private String staffCode;

    @Column(name = "full_name", length = 100, nullable = false)
    private String fullName;

    @Column(name = "gender", length = 10, nullable = false)
    private String gender; // MALE, FEMALE, OTHER

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "phone", length = 20, nullable = false)
    private String phone;

    @Column(name = "specialty_id", columnDefinition = "CHAR(36)")
    private String specialtyId;

    @Column(name = "room_id", columnDefinition = "CHAR(36)")
    private String roomId;

    @Column(name = "license_number", length = 50)
    private String licenseNumber;

    @Column(name = "qualification", length = 100)
    private String qualification;

    @Column(name = "status", length = 20, nullable = false)
    private String status = "ACTIVE"; // ACTIVE, ON_LEAVE, TERMINATED

    public StaffProfile() {
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getStaffCode() {
        return staffCode;
    }

    public void setStaffCode(String staffCode) {
        this.staffCode = staffCode;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public LocalDate getDateOfBirth() {
        return dateOfBirth;
    }

    public void setDateOfBirth(LocalDate dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
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

    public String getLicenseNumber() {
        return licenseNumber;
    }

    public void setLicenseNumber(String licenseNumber) {
        this.licenseNumber = licenseNumber;
    }

    public String getQualification() {
        return qualification;
    }

    public void setQualification(String qualification) {
        this.qualification = qualification;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
