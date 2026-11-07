package com.clinicmanagement.clinical.entity;

import com.clinicmanagement.common.entity.BaseEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "prescription_items")
public class PrescriptionItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prescription_id", nullable = false)
    private Prescription prescription;

    @Column(name = "medicine_id", columnDefinition = "CHAR(36)", nullable = false)
    private String medicineId;

    @Column(name = "medicine_name", length = 150, nullable = false)
    private String medicineName;

    @Column(name = "unit", length = 30, nullable = false)
    private String unit;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "morning_dose", length = 20)
    private String morningDose;

    @Column(name = "noon_dose", length = 20)
    private String noonDose;

    @Column(name = "evening_dose", length = 20)
    private String eveningDose;

    @Column(name = "night_dose", length = 20)
    private String nightDose;

    @Column(name = "usage_timing", length = 50)
    private String usageTiming; // Sau ăn 30 phút, Trước ăn 30 phút, Khi đau sốt...

    @Column(name = "usage_route", length = 30, nullable = false)
    private String usageRoute = "UONG"; // UONG, TIEM, BOI, NHO, DUNG_NGOAI

    @Column(name = "days_count")
    private Integer daysCount = 5;

    @Column(name = "instructions", columnDefinition = "TEXT")
    private String instructions;

    public PrescriptionItem() {
    }

    public Prescription getPrescription() {
        return prescription;
    }

    public void setPrescription(Prescription prescription) {
        this.prescription = prescription;
    }

    public String getMedicineId() {
        return medicineId;
    }

    public void setMedicineId(String medicineId) {
        this.medicineId = medicineId;
    }

    public String getMedicineName() {
        return medicineName;
    }

    public void setMedicineName(String medicineName) {
        this.medicineName = medicineName;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public String getMorningDose() {
        return morningDose;
    }

    public void setMorningDose(String morningDose) {
        this.morningDose = morningDose;
    }

    public String getNoonDose() {
        return noonDose;
    }

    public void setNoonDose(String noonDose) {
        this.noonDose = noonDose;
    }

    public String getEveningDose() {
        return eveningDose;
    }

    public void setEveningDose(String eveningDose) {
        this.eveningDose = eveningDose;
    }

    public String getNightDose() {
        return nightDose;
    }

    public void setNightDose(String nightDose) {
        this.nightDose = nightDose;
    }

    public String getUsageTiming() {
        return usageTiming;
    }

    public void setUsageTiming(String usageTiming) {
        this.usageTiming = usageTiming;
    }

    public String getUsageRoute() {
        return usageRoute;
    }

    public void setUsageRoute(String usageRoute) {
        this.usageRoute = usageRoute;
    }

    public Integer getDaysCount() {
        return daysCount;
    }

    public void setDaysCount(Integer daysCount) {
        this.daysCount = daysCount;
    }

    public String getInstructions() {
        return instructions;
    }

    public void setInstructions(String instructions) {
        this.instructions = instructions;
    }
}

