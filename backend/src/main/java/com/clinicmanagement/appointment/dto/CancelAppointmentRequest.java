package com.clinicmanagement.appointment.dto;

public class CancelAppointmentRequest {

    private String cancellationReason;

    public CancelAppointmentRequest() {
    }

    public CancelAppointmentRequest(String cancellationReason) {
        this.cancellationReason = cancellationReason;
    }

    public String getCancellationReason() {
        return cancellationReason;
    }

    public void setCancellationReason(String cancellationReason) {
        this.cancellationReason = cancellationReason;
    }
}

