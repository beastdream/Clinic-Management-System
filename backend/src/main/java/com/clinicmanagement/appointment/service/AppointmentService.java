package com.clinicmanagement.appointment.service;

import com.clinicmanagement.appointment.dto.AppointmentResponse;
import com.clinicmanagement.appointment.dto.CreateAppointmentRequest;
import com.clinicmanagement.appointment.entity.Appointment;
import com.clinicmanagement.appointment.repository.AppointmentRepository;
import com.clinicmanagement.clinic.entity.Room;
import com.clinicmanagement.clinic.entity.Specialty;
import com.clinicmanagement.clinic.repository.RoomRepository;
import com.clinicmanagement.clinic.repository.SpecialtyRepository;
import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.common.exception.ErrorCode;
import com.clinicmanagement.patient.entity.Patient;
import com.clinicmanagement.patient.repository.PatientRepository;
import com.clinicmanagement.staff.entity.StaffProfile;
import com.clinicmanagement.staff.repository.StaffProfileRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class AppointmentService {

    private static final Logger log = LoggerFactory.getLogger(AppointmentService.class);

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final StaffProfileRepository staffProfileRepository;
    private final SpecialtyRepository specialtyRepository;
    private final RoomRepository roomRepository;

    public AppointmentService(AppointmentRepository appointmentRepository,
                              PatientRepository patientRepository,
                              StaffProfileRepository staffProfileRepository,
                              SpecialtyRepository specialtyRepository,
                              RoomRepository roomRepository) {
        this.appointmentRepository = appointmentRepository;
        this.patientRepository = patientRepository;
        this.staffProfileRepository = staffProfileRepository;
        this.specialtyRepository = specialtyRepository;
        this.roomRepository = roomRepository;
    }

    @Transactional
    public AppointmentResponse createAppointment(CreateAppointmentRequest request) {
        // 1. Kiểm tra khóa ngoại Bệnh nhân
        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new BusinessException(ErrorCode.PATIENT_NOT_FOUND));

        // 2. Kiểm tra khóa ngoại Chuyên khoa
        Specialty specialty = specialtyRepository.findById(request.getSpecialtyId())
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

        // 3. Kiểm tra Bác sĩ nếu có chỉ định
        StaffProfile doctor = null;
        if (request.getDoctorId() != null && !request.getDoctorId().isBlank()) {
            doctor = staffProfileRepository.findById(request.getDoctorId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.DOCTOR_NOT_FOUND));

            // Kiểm tra trùng lịch hẹn với bác sĩ tại cùng ngày và giờ (chưa bị hủy)
            boolean isConflict = appointmentRepository.existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndStatusNot(
                    doctor.getId(),
                    request.getAppointmentDate(),
                    request.getAppointmentTime(),
                    "CANCELLED"
            );
            if (isConflict) {
                log.warn("Xung đột lịch hẹn: Bác sĩ [{}] đã có lịch vào [{}] lúc [{}]",
                        doctor.getFullName(), request.getAppointmentDate(), request.getAppointmentTime());
                throw new BusinessException(
                        ErrorCode.APPOINTMENT_SLOT_CONFLICT,
                        "Bác sĩ " + doctor.getFullName() + " đã có lịch hẹn khám vào lúc " +
                                request.getAppointmentTime() + " ngày " + request.getAppointmentDate() +
                                ". Vui lòng chọn khung giờ hoặc bác sĩ khác."
                );
            }
        }

        // 4. Kiểm tra Phòng nếu có
        Room room = null;
        if (request.getRoomId() != null && !request.getRoomId().isBlank()) {
            room = roomRepository.findById(request.getRoomId()).orElse(null);
        } else if (doctor != null && doctor.getRoomId() != null) {
            room = roomRepository.findById(doctor.getRoomId()).orElse(null);
        }

        // 5. Sinh mã lịch hẹn duy nhất LH-YYYYMMDD-XXXX
        String dateStr = request.getAppointmentDate().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long count = appointmentRepository.count() + 1;
        String appointmentCode = String.format("LH-%s-%03d", dateStr, count);
        while (appointmentRepository.existsByAppointmentCode(appointmentCode)) {
            count++;
            appointmentCode = String.format("LH-%s-%03d", dateStr, count);
        }

        Appointment apt = new Appointment();
        apt.setAppointmentCode(appointmentCode);
        apt.setPatientId(patient.getId());
        apt.setDoctorId(doctor != null ? doctor.getId() : null);
        apt.setSpecialtyId(specialty.getId());
        apt.setRoomId(room != null ? room.getId() : null);
        apt.setAppointmentDate(request.getAppointmentDate());
        apt.setAppointmentTime(request.getAppointmentTime());
        apt.setShift(request.getShift() != null ? request.getShift() : "MORNING");
        apt.setReason(request.getReason());
        apt.setAppointmentType(request.getAppointmentType() != null ? request.getAppointmentType() : "WALK_IN");
        apt.setStatus("CONFIRMED");

        Appointment saved = appointmentRepository.save(apt);
        log.info("Đặt lịch hẹn thành công: [{}] cho bệnh nhân [{}]", saved.getAppointmentCode(), patient.getFullName());

        return enrichResponse(saved, patient, doctor, specialty, room);
    }

    @Transactional
    public AppointmentResponse checkInAppointment(String id) {
        Appointment apt = appointmentRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.APPOINTMENT_NOT_FOUND));

        if ("CANCELLED".equals(apt.getStatus())) {
            throw new BusinessException(ErrorCode.INVALID_STATE_TRANSITION, "Không thể tiếp đón lịch hẹn đã bị hủy");
        }
        if ("COMPLETED".equals(apt.getStatus())) {
            throw new BusinessException(ErrorCode.INVALID_STATE_TRANSITION, "Lịch hẹn đã hoàn thành khám");
        }

        apt.setStatus("CHECKED_IN");
        Appointment saved = appointmentRepository.save(apt);
        log.info("Tiếp đón (Check-in) lịch hẹn thành công: [{}]", saved.getAppointmentCode());
        return enrichResponse(saved);
    }

    @Transactional
    public AppointmentResponse completeAppointment(String id) {
        Appointment apt = appointmentRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.APPOINTMENT_NOT_FOUND));

        if ("CANCELLED".equals(apt.getStatus())) {
            throw new BusinessException(ErrorCode.INVALID_STATE_TRANSITION, "Không thể hoàn thành lịch hẹn đã bị hủy");
        }

        apt.setStatus("COMPLETED");
        Appointment saved = appointmentRepository.save(apt);
        log.info("Hoàn tất lượt khám cho lịch hẹn: [{}]", saved.getAppointmentCode());
        return enrichResponse(saved);
    }

    @Transactional
    public AppointmentResponse cancelAppointment(String id, String reason) {
        Appointment apt = appointmentRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.APPOINTMENT_NOT_FOUND));

        if ("COMPLETED".equals(apt.getStatus())) {
            throw new BusinessException(ErrorCode.INVALID_STATE_TRANSITION, "Không thể hủy lịch hẹn đã hoàn thành khám");
        }

        apt.setStatus("CANCELLED");
        apt.setCancellationReason(reason != null && !reason.isBlank() ? reason.trim() : "Hủy theo yêu cầu của bệnh nhân hoặc phòng khám");
        Appointment saved = appointmentRepository.save(apt);
        log.info("Hủy lịch hẹn thành công: [{}] - Lý do: {}", saved.getAppointmentCode(), saved.getCancellationReason());
        return enrichResponse(saved);
    }

    @Transactional(readOnly = true)
    public Page<AppointmentResponse> getAppointments(String status, LocalDate date, String doctorId, String patientId, Pageable pageable) {
        Page<Appointment> page;
        if (date != null && status != null && !status.isBlank()) {
            page = appointmentRepository.findByAppointmentDateAndStatus(date, status, pageable);
        } else if (date != null) {
            page = appointmentRepository.findByAppointmentDate(date, pageable);
        } else if (status != null && !status.isBlank()) {
            page = appointmentRepository.findByStatus(status, pageable);
        } else if (doctorId != null && !doctorId.isBlank()) {
            page = appointmentRepository.findByDoctorId(doctorId, pageable);
        } else if (patientId != null && !patientId.isBlank()) {
            page = appointmentRepository.findByPatientId(patientId, pageable);
        } else {
            page = appointmentRepository.findAll(pageable);
        }

        return page.map(this::enrichResponse);
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getRecentAppointments() {
        return appointmentRepository.findAll().stream()
                .sorted((a, b) -> {
                    int c = b.getAppointmentDate().compareTo(a.getAppointmentDate());
                    if (c != 0) return c;
                    return b.getAppointmentTime().compareTo(a.getAppointmentTime());
                })
                .limit(50)
                .map(this::enrichResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public AppointmentResponse getAppointmentById(String id) {
        Appointment apt = appointmentRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.APPOINTMENT_NOT_FOUND));
        return enrichResponse(apt);
    }

    private AppointmentResponse enrichResponse(Appointment apt) {
        Patient patient = patientRepository.findById(apt.getPatientId()).orElse(null);
        StaffProfile doctor = apt.getDoctorId() != null ? staffProfileRepository.findById(apt.getDoctorId()).orElse(null) : null;
        Specialty specialty = specialtyRepository.findById(apt.getSpecialtyId()).orElse(null);
        Room room = apt.getRoomId() != null ? roomRepository.findById(apt.getRoomId()).orElse(null) : null;

        return enrichResponse(apt, patient, doctor, specialty, room);
    }

    private AppointmentResponse enrichResponse(Appointment apt, Patient patient, StaffProfile doctor, Specialty specialty, Room room) {
        AppointmentResponse resp = AppointmentResponse.fromEntity(apt);
        if (patient != null) {
            resp.setPatientName(patient.getFullName());
            resp.setPatientPhone(patient.getPhone());
        }
        if (doctor != null) {
            resp.setDoctorName(doctor.getFullName());
        }
        if (specialty != null) {
            resp.setSpecialtyName(specialty.getName());
        }
        if (room != null) {
            resp.setRoomName(room.getName());
        }
        return resp;
    }
}
