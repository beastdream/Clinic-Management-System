package com.clinicmanagement.dashboard.dto;

public class AppointmentStatusCount {

    private String status;
    private String label;
    private long count;
    private String color;

    public AppointmentStatusCount() {
    }

    public AppointmentStatusCount(String status, String label, long count, String color) {
        this.status = status;
        this.label = label;
        this.count = count;
        this.color = color;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public long getCount() {
        return count;
    }

    public void setCount(long count) {
        this.count = count;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }
}

