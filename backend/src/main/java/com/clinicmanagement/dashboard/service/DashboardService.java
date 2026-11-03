package com.clinicmanagement.dashboard.service;

import com.clinicmanagement.appointment.entity.Appointment;
import com.clinicmanagement.appointment.repository.AppointmentRepository;
import com.clinicmanagement.billing.repository.InvoiceRepository;
import com.clinicmanagement.clinic.repository.SpecialtyRepository;
import com.clinicmanagement.clinical.repository.EncounterRepository;
import com.clinicmanagement.dashboard.dto.AppointmentStatusCount;
import com.clinicmanagement.dashboard.dto.DailyAppointmentCount;
import com.clinicmanagement.dashboard.dto.DashboardStatsResponse;
import com.clinicmanagement.dashboard.dto.RecentAppointmentItem;
import com.clinicmanagement.patient.repository.PatientRepository;
import com.clinicmanagement.staff.repository.StaffProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service
@Transactional(readOnly = true)
public class DashboardService {

    private final PatientRepository patientRepository;
    private final StaffProfileRepository staffProfileRepository;
    private final AppointmentRepository appointmentRepository;
    private final EncounterRepository encounterRepository;
    private final InvoiceRepository invoiceRepository;
    private final SpecialtyRepository specialtyRepository;

    public DashboardService(
            PatientRepository patientRepository,
            StaffProfileRepository staffProfileRepository,
            AppointmentRepository appointmentRepository,
            EncounterRepository encounterRepository,
            InvoiceRepository invoiceRepository,
            SpecialtyRepository specialtyRepository
    ) {
        this.patientRepository = patientRepository;
        this.staffProfileRepository = staffProfileRepository;
        this.appointmentRepository = appointmentRepository;
        this.encounterRepository = encounterRepository;
        this.invoiceRepository = invoiceRepository;
        this.specialtyRepository = specialtyRepository;
    }

    public DashboardStatsResponse getDashboardStats() {
        DashboardStatsResponse res = new DashboardStatsResponse();

        // 1. Tổng số bệnh nhân
        res.setTotalPatients(patientRepository.countByDeletedAtIsNull());

        // 2. Tổng số bác sĩ
        res.setTotalDoctors(staffProfileRepository.countDoctors());

        // 3. Lịch hẹn hôm nay
        LocalDate today = LocalDate.now();
        res.setTodayAppointments(appointmentRepository.countByAppointmentDate(today));

        // 4. Lịch hẹn đang chờ khám (CHECKED_IN, CONFIRMED, PENDING)
        res.setWaitingAppointments(appointmentRepository.countByStatusIn(List.of("CHECKED_IN", "CONFIRMED")));

        // 5. Số lượt khám đã hoàn thành
        res.setCompletedEncounters(encounterRepository.countByDeletedAtIsNullAndStatus("COMPLETED"));

        // 6. Doanh thu viện phí đã thanh toán
        BigDecimal paidRev = invoiceRepository.calculateTotalPaidRevenue();
        res.setPaidRevenue(paidRev != null ? paidRev : BigDecimal.ZERO);

        // 7. Thống kê lịch hẹn theo trạng thái
        List<Object[]> statusRows = appointmentRepository.countAppointmentsByStatus();
        List<AppointmentStatusCount> breakdown = new ArrayList<>();
        for (Object[] row : statusRows) {
            String status = (String) row[0];
            long count = ((Number) row[1]).longValue();
            String label = mapStatusLabel(status);
            String color = mapStatusColor(status);
            breakdown.add(new AppointmentStatusCount(status, label, count, color));
        }
        res.setStatusBreakdown(breakdown);

        // 8. Thống kê lịch hẹn theo ngày gần đây
        List<Object[]> dateRows = appointmentRepository.countAppointmentsByDate();
        List<DailyAppointmentCount> dailyList = new ArrayList<>();
        int limit = Math.min(dateRows.size(), 7);
        for (int i = 0; i < limit; i++) {
            Object[] row = dateRows.get(i);
            String dateStr = row[0] != null ? row[0].toString() : "";
            long count = ((Number) row[1]).longValue();
            dailyList.add(new DailyAppointmentCount(dateStr, count));
        }
        // Đảo lại theo thứ tự thời gian tăng dần cho biểu đồ
        Collections.reverse(dailyList);
        res.setDailyAppointments(dailyList);

        // 9. Danh sách lịch hẹn gần đây (Top 5)
        List<Appointment> topAppointments = appointmentRepository.findTop5ByOrderByCreatedAtDesc();
        List<RecentAppointmentItem> recentItems = new ArrayList<>();
        for (Appointment a : topAppointments) {
            RecentAppointmentItem item = new RecentAppointmentItem();
            item.setId(a.getId());
            item.setAppointmentCode(a.getAppointmentCode());
            item.setAppointmentDate(a.getAppointmentDate() != null ? a.getAppointmentDate().toString() : "");
            item.setAppointmentTime(a.getAppointmentTime() != null ? a.getAppointmentTime().toString() : "");
            item.setStatus(a.getStatus());
            item.setReason(a.getReason());

            if (a.getPatientId() != null) {
                patientRepository.findById(a.getPatientId()).ifPresent(p -> {
                    item.setPatientName(p.getFullName());
                    item.setPatientCode(p.getPatientCode());
                });
            }

            if (a.getDoctorId() != null) {
                staffProfileRepository.findById(a.getDoctorId()).ifPresent(d -> {
                    item.setDoctorName(d.getFullName());
                });
            }

            if (a.getSpecialtyId() != null) {
                specialtyRepository.findById(a.getSpecialtyId()).ifPresent(s -> {
                    item.setSpecialtyName(s.getName());
                });
            }

            recentItems.add(item);
        }
        res.setRecentAppointments(recentItems);

        // 10. Thông tin sức khỏe hệ thống
        Map<String, Object> health = new LinkedHashMap<>();
        health.put("status", "UP");
        health.put("database", "MySQL 8.0/8.4 LTS");
        health.put("flywayVersion", "v7");
        health.put("environment", "Development");
        res.setSystemHealth(health);

        return res;
    }

    private String mapStatusLabel(String status) {
        if (status == null) return "Không xác định";
        return switch (status.toUpperCase()) {
            case "PENDING" -> "Chờ xác nhận";
            case "CONFIRMED" -> "Đã xác nhận";
            case "CHECKED_IN" -> "Đã đến (Hàng chờ)";
            case "IN_PROGRESS" -> "Đang khám";
            case "COMPLETED" -> "Đã hoàn thành";
            case "CANCELLED" -> "Đã hủy";
            default -> status;
        };
    }

    private String mapStatusColor(String status) {
        if (status == null) return "#64748b";
        return switch (status.toUpperCase()) {
            case "PENDING" -> "#3b82f6";    // Blue
            case "CONFIRMED" -> "#0ea5e9";  // Sky
            case "CHECKED_IN" -> "#f59e0b"; // Amber
            case "IN_PROGRESS" -> "#8b5cf6";// Purple
            case "COMPLETED" -> "#10b981";  // Emerald
            case "CANCELLED" -> "#f43f5e";  // Rose
            default -> "#64748b";          // Slate
        };
    }
}

