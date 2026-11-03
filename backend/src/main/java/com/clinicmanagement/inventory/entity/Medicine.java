package com.clinicmanagement.inventory.entity;

import com.clinicmanagement.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.math.BigDecimal;

@Entity
@Table(name = "medicines")
public class Medicine extends BaseEntity {

    @Column(name = "code", length = 30, nullable = false, unique = true)
    private String code;

    @Column(name = "name", length = 150, nullable = false)
    private String name;

    @Column(name = "generic_name", length = 150, nullable = false)
    private String genericName;

    @Column(name = "registration_number", length = 50)
    private String registrationNumber;

    @Column(name = "unit", length = 30, nullable = false)
    private String unit; // VIEN, VI, HOP, LO, GOI, ONG

    @Column(name = "unit_price", precision = 19, scale = 2, nullable = false)
    private BigDecimal unitPrice = BigDecimal.ZERO;

    @Column(name = "current_stock", precision = 12, scale = 3, nullable = false)
    private BigDecimal currentStock = BigDecimal.ZERO;

    @Column(name = "min_stock_alert", precision = 12, scale = 3, nullable = false)
    private BigDecimal minStockAlert = BigDecimal.valueOf(50);

    @Column(name = "is_prescription_required", nullable = false)
    private boolean prescriptionRequired = true;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    public Medicine() {
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

    public String getGenericName() {
        return genericName;
    }

    public void setGenericName(String genericName) {
        this.genericName = genericName;
    }

    public String getRegistrationNumber() {
        return registrationNumber;
    }

    public void setRegistrationNumber(String registrationNumber) {
        this.registrationNumber = registrationNumber;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }

    public BigDecimal getCurrentStock() {
        return currentStock;
    }

    public void setCurrentStock(BigDecimal currentStock) {
        this.currentStock = currentStock;
    }

    public BigDecimal getMinStockAlert() {
        return minStockAlert;
    }

    public void setMinStockAlert(BigDecimal minStockAlert) {
        this.minStockAlert = minStockAlert;
    }

    public boolean isPrescriptionRequired() {
        return prescriptionRequired;
    }

    public void setPrescriptionRequired(boolean prescriptionRequired) {
        this.prescriptionRequired = prescriptionRequired;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
