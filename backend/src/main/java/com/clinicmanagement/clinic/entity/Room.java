package com.clinicmanagement.clinic.entity;

import com.clinicmanagement.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "rooms")
public class Room extends BaseEntity {

    @Column(name = "clinic_id", columnDefinition = "CHAR(36)", nullable = false)
    private String clinicId;

    @Column(name = "branch_id", columnDefinition = "CHAR(36)")
    private String branchId;

    @Column(name = "specialty_id", columnDefinition = "CHAR(36)")
    private String specialtyId;

    @Column(name = "code", length = 30, nullable = false, unique = true)
    private String code;

    @Column(name = "name", length = 100, nullable = false)
    private String name;

    @Column(name = "room_type", length = 30, nullable = false)
    private String roomType; // EXAM, LAB, RADIOLOGY, PHARMACY, RECEPTION, CASHIER

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    public Room() {
    }

    public String getClinicId() {
        return clinicId;
    }

    public void setClinicId(String clinicId) {
        this.clinicId = clinicId;
    }

    public String getBranchId() {
        return branchId;
    }

    public void setBranchId(String branchId) {
        this.branchId = branchId;
    }

    public String getSpecialtyId() {
        return specialtyId;
    }

    public void setSpecialtyId(String specialtyId) {
        this.specialtyId = specialtyId;
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

    public String getRoomType() {
        return roomType;
    }

    public void setRoomType(String roomType) {
        this.roomType = roomType;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
