package com.clinicmanagement.staff.entity;

import com.clinicmanagement.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "staff_schedules")
public class StaffSchedule extends BaseEntity {

    @Column(name = "staff_id", columnDefinition = "CHAR(36)", nullable = false)
    private String staffId;

    @Column(name = "room_id", columnDefinition = "CHAR(36)", nullable = false)
    private String roomId;

    @Column(name = "work_date", nullable = false)
    private LocalDate workDate;

    @Column(name = "shift", length = 20, nullable = false)
    private String shift; // MORNING, AFTERNOON, EVENING, FULL_DAY

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(name = "max_patients", nullable = false)
    private int maxPatients = 30;

    @Column(name = "status", length = 20, nullable = false)
    private String status = "AVAILABLE"; // AVAILABLE, FULL, OFF

    public StaffSchedule() {
    }

    public String getStaffId() {
        return staffId;
    }

    public void setStaffId(String staffId) {
        this.staffId = staffId;
    }

    public String getRoomId() {
        return roomId;
    }

    public void setRoomId(String roomId) {
        this.roomId = roomId;
    }

    public LocalDate getWorkDate() {
        return workDate;
    }

    public void setWorkDate(LocalDate workDate) {
        this.workDate = workDate;
    }

    public String getShift() {
        return shift;
    }

    public void setShift(String shift) {
        this.shift = shift;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }

    public int getMaxPatients() {
        return maxPatients;
    }

    public void setMaxPatients(int maxPatients) {
        this.maxPatients = maxPatients;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
