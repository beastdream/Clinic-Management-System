package com.clinicmanagement.clinic.entity;

import com.clinicmanagement.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "branches")
public class Branch extends BaseEntity {

    @Column(name = "clinic_id", columnDefinition = "CHAR(36)", nullable = false)
    private String clinicId;

    @Column(name = "code", length = 30, nullable = false, unique = true)
    private String code;

    @Column(name = "name", length = 150, nullable = false)
    private String name;

    @Column(name = "address", length = 255, nullable = false)
    private String address;

    @Column(name = "phone", length = 20, nullable = false)
    private String phone;

    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    public Branch() {
    }

    public String getClinicId() {
        return clinicId;
    }

    public void setClinicId(String clinicId) {
        this.clinicId = clinicId;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
