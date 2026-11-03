package com.clinicmanagement.billing.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.ArrayList;
import java.util.List;

public class CreateInvoiceRequest {

    @NotBlank(message = "Mã bệnh nhân không được để trống")
    private String patientId;

    private String encounterId;

    private String appointmentId;

    private String notes;

    @NotEmpty(message = "Hóa đơn phải có ít nhất một dịch vụ y tế")
    @Valid
    private List<CreateInvoiceItemRequest> items = new ArrayList<>();

    public CreateInvoiceRequest() {
    }

    public String getPatientId() {
        return patientId;
    }

    public void setPatientId(String patientId) {
        this.patientId = patientId;
    }

    public String getEncounterId() {
        return encounterId;
    }

    public void setEncounterId(String encounterId) {
        this.encounterId = encounterId;
    }

    public String getAppointmentId() {
        return appointmentId;
    }

    public void setAppointmentId(String appointmentId) {
        this.appointmentId = appointmentId;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public List<CreateInvoiceItemRequest> getItems() {
        return items;
    }

    public void setItems(List<CreateInvoiceItemRequest> items) {
        this.items = items;
    }
}

