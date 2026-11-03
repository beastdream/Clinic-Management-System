package com.clinicmanagement.dashboard.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class DashboardStatsResponse {

    private long totalPatients;
    private long totalDoctors;
    private long todayAppointments;
    private long waitingAppointments;
    private long completedEncounters;
    private BigDecimal paidRevenue = BigDecimal.ZERO;
    private List<AppointmentStatusCount> statusBreakdown = new ArrayList<>();
    private List<DailyAppointmentCount> dailyAppointments = new ArrayList<>();
    private List<RecentAppointmentItem> recentAppointments = new ArrayList<>();
    private Map<String, Object> systemHealth = new HashMap<>();

    public DashboardStatsResponse() {
    }

    public long getTotalPatients() {
        return totalPatients;
    }

    public void setTotalPatients(long totalPatients) {
        this.totalPatients = totalPatients;
    }

    public long getTotalDoctors() {
        return totalDoctors;
    }

    public void setTotalDoctors(long totalDoctors) {
        this.totalDoctors = totalDoctors;
    }

    public long getTodayAppointments() {
        return todayAppointments;
    }

    public void setTodayAppointments(long todayAppointments) {
        this.todayAppointments = todayAppointments;
    }

    public long getWaitingAppointments() {
        return waitingAppointments;
    }

    public void setWaitingAppointments(long waitingAppointments) {
        this.waitingAppointments = waitingAppointments;
    }

    public long getCompletedEncounters() {
        return completedEncounters;
    }

    public void setCompletedEncounters(long completedEncounters) {
        this.completedEncounters = completedEncounters;
    }

    public BigDecimal getPaidRevenue() {
        return paidRevenue;
    }

    public void setPaidRevenue(BigDecimal paidRevenue) {
        this.paidRevenue = paidRevenue;
    }

    public List<AppointmentStatusCount> getStatusBreakdown() {
        return statusBreakdown;
    }

    public void setStatusBreakdown(List<AppointmentStatusCount> statusBreakdown) {
        this.statusBreakdown = statusBreakdown;
    }

    public List<DailyAppointmentCount> getDailyAppointments() {
        return dailyAppointments;
    }

    public void setDailyAppointments(List<DailyAppointmentCount> dailyAppointments) {
        this.dailyAppointments = dailyAppointments;
    }

    public List<RecentAppointmentItem> getRecentAppointments() {
        return recentAppointments;
    }

    public void setRecentAppointments(List<RecentAppointmentItem> recentAppointments) {
        this.recentAppointments = recentAppointments;
    }

    public Map<String, Object> getSystemHealth() {
        return systemHealth;
    }

    public void setSystemHealth(Map<String, Object> systemHealth) {
        this.systemHealth = systemHealth;
    }
}

