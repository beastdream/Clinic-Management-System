package com.clinicmanagement.clinical.service;

import com.clinicmanagement.appointment.entity.Appointment;
import com.clinicmanagement.appointment.repository.AppointmentRepository;
import com.clinicmanagement.audit.entity.AuditLog;
import com.clinicmanagement.audit.repository.AuditLogRepository;
import com.clinicmanagement.clinic.entity.Room;
import com.clinicmanagement.clinic.entity.Specialty;
import com.clinicmanagement.clinic.repository.RoomRepository;
import com.clinicmanagement.clinic.repository.SpecialtyRepository;
import com.clinicmanagement.clinical.dto.*;
import com.clinicmanagement.clinical.entity.Encounter;
import com.clinicmanagement.clinical.repository.EncounterRepository;
import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.common.exception.ErrorCode;
import com.clinicmanagement.common.response.PageResponse;
import com.clinicmanagement.patient.entity.Patient;
import com.clinicmanagement.patient.entity.PatientUserLink;
import com.clinicmanagement.patient.repository.PatientRepository;
import com.clinicmanagement.patient.repository.PatientUserLinkRepository;
import com.clinicmanagement.security.SecurityContextHelper;
import com.clinicmanagement.staff.entity.StaffProfile;
import com.clinicmanagement.staff.repository.StaffProfileRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@Transactional(readOnly = true)
public class EncounterService {

    private final EncounterRepository encounterRepository;
    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final StaffProfileRepository staffProfileRepository;
    private final PatientUserLinkRepository patientUserLinkRepository;
    private final RoomRepository roomRepository;
    private final SpecialtyRepository specialtyRepository;
    private final AuditLogRepository auditLogRepository;

    public EncounterService(
            EncounterRepository encounterRepository,
            AppointmentRepository appointmentRepository,
            PatientRepository patientRepository,
            StaffProfileRepository staffProfileRepository,
            PatientUserLinkRepository patientUserLinkRepository,
            RoomRepository roomRepository,
            SpecialtyRepository specialtyRepository,
            AuditLogRepository auditLogRepository
    ) {
        this.encounterRepository = encounterRepository;
        this.appointmentRepository = appointmentRepository;
        this.patientRepository = patientRepository;
        this.staffProfileRepository = staffProfileRepository;
        this.patientUserLinkRepository = patientUserLinkRepository;
        this.roomRepository = roomRepository;
        this.specialtyRepository = specialtyRepository;
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * Lấy danh sách bệnh nhân đang chờ khám trong ca trực của Bác sĩ hiện tại
     */
    public List<DoctorQueueItemResponse> getDoctorQueue(String currentUserId) {
        StaffProfile doctorProfile = staffProfileRepository.findByUserId(currentUserId)
                .orElseThrow(() -> new BusinessException(ErrorCode.DOCTOR_NOT_FOUND, "Không tìm thấy hồ sơ bác sĩ cho tài khoản hiện tại"));

        List<Appointment> appointments = appointmentRepository
                .findByDoctorIdAndStatusInOrderByAppointmentDateAscAppointmentTimeAsc(
                        doctorProfile.getId(),
                        List.of("CHECKED_IN", "IN_PROGRESS")
                );

        List<DoctorQueueItemResponse> responseList = new ArrayList<>();
        for (Appointment apt : appointments) {
            DoctorQueueItemResponse item = new DoctorQueueItemResponse();
            item.setAppointmentId(apt.getId());
            item.setAppointmentCode(apt.getAppointmentCode());
            item.setAppointmentDate(apt.getAppointmentDate());
            item.setAppointmentTime(apt.getAppointmentTime());
            item.setAppointmentReason(apt.getReason());
            item.setAppointmentStatus(apt.getStatus());
            item.setPatientId(apt.getPatientId());

            patientRepository.findByIdAndDeletedAtIsNull(apt.getPatientId()).ifPresent(patient -> {
                item.setPatientCode(patient.getPatientCode());
                item.setPatientName(patient.getFullName());
                item.setGender(patient.getGender());
                item.setDateOfBirth(patient.getDateOfBirth());
                item.setPhone(patient.getPhone());
            });

            if (apt.getSpecialtyId() != null) {
                specialtyRepository.findById(apt.getSpecialtyId())
                        .ifPresent(spec -> item.setSpecialtyName(spec.getName()));
            }

            if (apt.getRoomId() != null) {
                roomRepository.findById(apt.getRoomId())
                        .ifPresent(room -> item.setRoomName(room.getName()));
            }

            // Kiểm tra xem lượt khám đã bắt đầu chưa
            encounterRepository.findByAppointmentIdAndDeletedAtIsNull(apt.getId()).ifPresent(encounter -> {
                item.setEncounterId(encounter.getId());
                item.setEncounterStatus(encounter.getStatus());
            });

            responseList.add(item);
        }

        return responseList;
    }

    /**
     * Bác sĩ bắt đầu một lượt khám từ Lịch hẹn (bệnh nhân đã CHECKED_IN hoặc đang IN_PROGRESS)
     */
    @Transactional
    public EncounterResponse startEncounterFromAppointment(String appointmentId, String currentUserId) {
        StaffProfile doctorProfile = staffProfileRepository.findByUserId(currentUserId)
                .orElseThrow(() -> new BusinessException(ErrorCode.DOCTOR_NOT_FOUND, "Không tìm thấy hồ sơ bác sĩ"));

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.APPOINTMENT_NOT_FOUND));

        if (appointment.getDeletedAt() != null) {
            throw new BusinessException(ErrorCode.APPOINTMENT_NOT_FOUND, "Lịch hẹn đã bị xóa");
        }

        // Bác sĩ chỉ được bắt đầu lượt khám của lịch hẹn mình phụ trách (nếu đã phân công)
        if (appointment.getDoctorId() != null && !appointment.getDoctorId().equals(doctorProfile.getId())) {
            throw new BusinessException(ErrorCode.DATA_OWNERSHIP_VIOLATION, "Lịch hẹn này được phân công cho bác sĩ khác");
        }

        // Nếu lịch hẹn chưa có doctor_id, gán cho bác sĩ hiện tại
        if (appointment.getDoctorId() == null) {
            appointment.setDoctorId(doctorProfile.getId());
        }

        // Kiểm tra xem đã có lượt khám cho lịch hẹn này chưa
        Optional<Encounter> existingEncounterOpt = encounterRepository.findByAppointmentIdAndDeletedAtIsNull(appointmentId);
        if (existingEncounterOpt.isPresent()) {
            Encounter existing = existingEncounterOpt.get();
            if ("COMPLETED".equals(existing.getStatus())) {
                throw new BusinessException(ErrorCode.ENCOUNTER_ALREADY_COMPLETED, "Lịch hẹn này đã có phiếu khám hoàn thành");
            }
            // Nếu đã có lượt khám IN_PROGRESS, tiếp tục lượt khám đó
            return mapToResponse(existing);
        }

        // Tạo mới phiếu khám
        Encounter encounter = new Encounter();
        encounter.setEncounterCode(generateEncounterCode());
        encounter.setAppointmentId(appointment.getId());
        encounter.setPatientId(appointment.getPatientId());
        encounter.setDoctorId(doctorProfile.getId());
        encounter.setRoomId(appointment.getRoomId() != null ? appointment.getRoomId() : doctorProfile.getRoomId());
        encounter.setEncounterDateTime(LocalDateTime.now());
        encounter.setChiefComplaint(appointment.getReason() != null && !appointment.getReason().isBlank() 
                ? appointment.getReason() 
                : "Bệnh nhân đến khám theo lịch hẹn " + appointment.getAppointmentCode());
        encounter.setDiagnosis("Đang tiến hành khám lâm sàng");
        encounter.setStatus("IN_PROGRESS");
        encounter.setCreatedBy(currentUserId);

        Encounter savedEncounter = encounterRepository.save(encounter);

        // Chuyển trạng thái lịch hẹn sang IN_PROGRESS
        appointment.setStatus("IN_PROGRESS");
        appointmentRepository.save(appointment);

        recordAudit(currentUserId, "START_ENCOUNTER", "encounters", savedEncounter.getId(),
                "Bác sĩ bắt đầu lượt khám mã " + savedEncounter.getEncounterCode() + " cho lịch hẹn " + appointment.getAppointmentCode());

        return mapToResponse(savedEncounter);
    }

    /**
     * Tạo trực tiếp một phiếu khám lâm sàng (dành cho khám vãng lai hoặc bổ sung)
     */
    @Transactional
    public EncounterResponse createEncounter(CreateEncounterRequest request, String currentUserId) {
        StaffProfile doctorProfile = staffProfileRepository.findByUserId(currentUserId)
                .orElseThrow(() -> new BusinessException(ErrorCode.DOCTOR_NOT_FOUND, "Chỉ bác sĩ mới có quyền tạo phiếu khám"));

        if (!patientRepository.existsById(request.getPatientId())) {
            throw new BusinessException(ErrorCode.PATIENT_NOT_FOUND);
        }

        if (request.getAppointmentId() != null && !request.getAppointmentId().isBlank()) {
            if (encounterRepository.existsByAppointmentIdAndDeletedAtIsNull(request.getAppointmentId())) {
                throw new BusinessException(ErrorCode.ENCOUNTER_ALREADY_EXISTS, "Lịch hẹn này đã có lượt khám");
            }
        }

        Encounter encounter = new Encounter();
        encounter.setEncounterCode(generateEncounterCode());
        encounter.setAppointmentId(request.getAppointmentId());
        encounter.setPatientId(request.getPatientId());
        encounter.setDoctorId(doctorProfile.getId());
        encounter.setRoomId(request.getRoomId() != null ? request.getRoomId() : doctorProfile.getRoomId());
        encounter.setEncounterDateTime(LocalDateTime.now());
        encounter.setChiefComplaint(request.getChiefComplaint());
        encounter.setExaminationNotes(request.getExaminationNotes());
        encounter.setDiagnosis(request.getDiagnosis());
        encounter.setTreatmentPlan(request.getTreatmentPlan());
        encounter.setTemperature(request.getTemperature());
        encounter.setBloodPressure(request.getBloodPressure());
        encounter.setHeartRate(request.getHeartRate());
        encounter.setRespiratoryRate(request.getRespiratoryRate());
        encounter.setWeight(request.getWeight());
        encounter.setHeight(request.getHeight());
        encounter.setStatus("IN_PROGRESS");
        encounter.setCreatedBy(currentUserId);

        Encounter saved = encounterRepository.save(encounter);

        if (request.getAppointmentId() != null && !request.getAppointmentId().isBlank()) {
            appointmentRepository.findById(request.getAppointmentId()).ifPresent(apt -> {
                apt.setStatus("IN_PROGRESS");
                apt.setDoctorId(doctorProfile.getId());
                appointmentRepository.save(apt);
            });
        }

        recordAudit(currentUserId, "CREATE_ENCOUNTER", "encounters", saved.getId(),
                "Tạo phiếu khám mới " + saved.getEncounterCode());

        return mapToResponse(saved);
    }

    /**
     * Bác sĩ cập nhật nội dung phiếu khám (chỉ áp dụng khi IN_PROGRESS)
     */
    @Transactional
    public EncounterResponse updateEncounter(String id, UpdateEncounterRequest request, String currentUserId) {
        Encounter encounter = encounterRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.ENCOUNTER_NOT_FOUND));

        if ("COMPLETED".equalsIgnoreCase(encounter.getStatus())) {
            throw new BusinessException(ErrorCode.ENCOUNTER_ALREADY_COMPLETED);
        }

        StaffProfile doctorProfile = staffProfileRepository.findByUserId(currentUserId)
                .orElseThrow(() -> new BusinessException(ErrorCode.DOCTOR_NOT_FOUND));

        // Kiểm tra quyền sở hữu của Bác sĩ
        if (!encounter.getDoctorId().equals(doctorProfile.getId())) {
            throw new BusinessException(ErrorCode.DATA_OWNERSHIP_VIOLATION, "Bác sĩ không có quyền sửa phiếu khám của bác sĩ khác");
        }

        if (request.getChiefComplaint() != null && !request.getChiefComplaint().isBlank()) {
            encounter.setChiefComplaint(request.getChiefComplaint());
        }
        if (request.getExaminationNotes() != null) {
            encounter.setExaminationNotes(request.getExaminationNotes());
        }
        if (request.getDiagnosis() != null && !request.getDiagnosis().isBlank()) {
            encounter.setDiagnosis(request.getDiagnosis());
        }
        if (request.getTreatmentPlan() != null) {
            encounter.setTreatmentPlan(request.getTreatmentPlan());
        }
        if (request.getTemperature() != null) {
            encounter.setTemperature(request.getTemperature());
        }
        if (request.getBloodPressure() != null) {
            encounter.setBloodPressure(request.getBloodPressure());
        }
        if (request.getHeartRate() != null) {
            encounter.setHeartRate(request.getHeartRate());
        }
        if (request.getRespiratoryRate() != null) {
            encounter.setRespiratoryRate(request.getRespiratoryRate());
        }
        if (request.getWeight() != null) {
            encounter.setWeight(request.getWeight());
        }
        if (request.getHeight() != null) {
            encounter.setHeight(request.getHeight());
        }

        Encounter updated = encounterRepository.save(encounter);

        recordAudit(currentUserId, "UPDATE_ENCOUNTER", "encounters", updated.getId(),
                "Cập nhật nội dung phiếu khám " + updated.getEncounterCode());

        return mapToResponse(updated);
    }

    /**
     * Bác sĩ hoàn thành lượt khám (COMPLETED) - Khóa an toàn không cho phép chỉnh sửa tiếp
     */
    @Transactional
    public EncounterResponse completeEncounter(String id, String currentUserId) {
        Encounter encounter = encounterRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.ENCOUNTER_NOT_FOUND));

        if ("COMPLETED".equalsIgnoreCase(encounter.getStatus())) {
            throw new BusinessException(ErrorCode.ENCOUNTER_ALREADY_COMPLETED, "Lượt khám này đã được hoàn thành trước đó");
        }

        StaffProfile doctorProfile = staffProfileRepository.findByUserId(currentUserId)
                .orElseThrow(() -> new BusinessException(ErrorCode.DOCTOR_NOT_FOUND));

        if (!encounter.getDoctorId().equals(doctorProfile.getId())) {
            throw new BusinessException(ErrorCode.DATA_OWNERSHIP_VIOLATION, "Chỉ bác sĩ phụ trách mới có quyền kết thúc lượt khám");
        }

        if (encounter.getDiagnosis() == null || encounter.getDiagnosis().isBlank() || encounter.getDiagnosis().startsWith("Đang tiến hành")) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST, "Vui lòng nhập chẩn đoán cụ thể trước khi hoàn tất lượt khám");
        }

        encounter.setStatus("COMPLETED");
        Encounter completed = encounterRepository.save(encounter);

        // Cập nhật trạng thái lịch hẹn liên kết sang COMPLETED
        if (encounter.getAppointmentId() != null) {
            appointmentRepository.findById(encounter.getAppointmentId()).ifPresent(apt -> {
                apt.setStatus("COMPLETED");
                appointmentRepository.save(apt);
            });
        }

        recordAudit(currentUserId, "COMPLETE_ENCOUNTER", "encounters", completed.getId(),
                "Hoàn tất lượt khám " + completed.getEncounterCode() + " với chẩn đoán: " + completed.getDiagnosis());

        return mapToResponse(completed);
    }

    /**
     * Xem chi tiết phiếu khám với kiểm tra Clinical Privacy & Data Ownership
     */
    public EncounterResponse getEncounterById(String id, String currentUserId, Set<String> roles) {
        Encounter encounter = encounterRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.ENCOUNTER_NOT_FOUND));

        // Nguyên tắc Rule 4 AGENTS.md: Admin không có quyền xem bệnh án
        if (roles.contains("ROLE_ADMIN") && !roles.contains("ROLE_DOCTOR")) {
            throw new BusinessException(ErrorCode.CLINICAL_PRIVACY_RESTRICTION);
        }

        // Bác sĩ chỉ xem bệnh án do mình phụ trách
        if (roles.contains("ROLE_DOCTOR")) {
            StaffProfile doctorProfile = staffProfileRepository.findByUserId(currentUserId).orElse(null);
            if (doctorProfile != null && !encounter.getDoctorId().equals(doctorProfile.getId())) {
                throw new BusinessException(ErrorCode.DATA_OWNERSHIP_VIOLATION, "Bác sĩ chỉ được xem hồ sơ khám của chính mình phụ trách");
            }
        }

        // Bệnh nhân portal chỉ xem bệnh án của chính mình
        if (roles.contains("ROLE_PATIENT")) {
            PatientUserLink link = patientUserLinkRepository.findByUserId(currentUserId).orElse(null);
            if (link == null || !encounter.getPatientId().equals(link.getPatientId())) {
                throw new BusinessException(ErrorCode.DATA_OWNERSHIP_VIOLATION, "Bệnh nhân chỉ được xem hồ sơ khám của chính mình");
            }
        }

        recordAudit(currentUserId, "ACCESS_ENCOUNTER", "encounters", encounter.getId(),
                "Truy cập xem chi tiết bệnh án " + encounter.getEncounterCode());

        return mapToResponse(encounter);
    }

    /**
     * Xem lịch sử các lần khám của một bệnh nhân
     */
    public List<EncounterResponse> getPatientHistory(String patientId, String currentUserId, Set<String> roles) {
        // Nguyên tắc Rule 4: Admin không xem bệnh án
        if (roles.contains("ROLE_ADMIN") && !roles.contains("ROLE_DOCTOR")) {
            throw new BusinessException(ErrorCode.CLINICAL_PRIVACY_RESTRICTION);
        }

        if (roles.contains("ROLE_PATIENT")) {
            PatientUserLink link = patientUserLinkRepository.findByUserId(currentUserId).orElse(null);
            if (link == null || !link.getPatientId().equals(patientId)) {
                throw new BusinessException(ErrorCode.DATA_OWNERSHIP_VIOLATION, "Bệnh nhân chỉ được xem lịch sử khám của chính mình");
            }
        }

        List<Encounter> encounters = encounterRepository
                .findByPatientIdAndDeletedAtIsNullOrderByEncounterDateTimeDesc(patientId);

        return encounters.stream().map(this::mapToResponse).toList();
    }

    /**
     * Tìm kiếm và phân trang danh sách lượt khám
     */
    public PageResponse<EncounterResponse> searchEncounters(
            String patientId,
            String status,
            String search,
            Pageable pageable,
            String currentUserId,
            Set<String> roles
    ) {
        if (roles.contains("ROLE_ADMIN") && !roles.contains("ROLE_DOCTOR")) {
            throw new BusinessException(ErrorCode.CLINICAL_PRIVACY_RESTRICTION);
        }

        String doctorId = null;
        if (roles.contains("ROLE_DOCTOR")) {
            StaffProfile doctorProfile = staffProfileRepository.findByUserId(currentUserId).orElse(null);
            if (doctorProfile != null) {
                doctorId = doctorProfile.getId();
            }
        }

        if (roles.contains("ROLE_PATIENT")) {
            PatientUserLink link = patientUserLinkRepository.findByUserId(currentUserId).orElse(null);
            if (link != null) {
                patientId = link.getPatientId();
            }
        }

        Page<Encounter> page = encounterRepository.searchEncounters(
                doctorId,
                patientId,
                status,
                search != null && !search.isBlank() ? search : null,
                pageable
        );

        return PageResponse.from(page.map(this::mapToResponse));
    }

    private EncounterResponse mapToResponse(Encounter encounter) {
        EncounterResponse res = new EncounterResponse();
        res.setId(encounter.getId());
        res.setEncounterCode(encounter.getEncounterCode());
        res.setAppointmentId(encounter.getAppointmentId());
        res.setPatientId(encounter.getPatientId());
        res.setDoctorId(encounter.getDoctorId());
        res.setRoomId(encounter.getRoomId());
        res.setEncounterDateTime(encounter.getEncounterDateTime());
        res.setChiefComplaint(encounter.getChiefComplaint());
        res.setExaminationNotes(encounter.getExaminationNotes());
        res.setDiagnosis(encounter.getDiagnosis());
        res.setTreatmentPlan(encounter.getTreatmentPlan());
        res.setStatus(encounter.getStatus());
        res.setTemperature(encounter.getTemperature());
        res.setBloodPressure(encounter.getBloodPressure());
        res.setHeartRate(encounter.getHeartRate());
        res.setRespiratoryRate(encounter.getRespiratoryRate());
        res.setWeight(encounter.getWeight());
        res.setHeight(encounter.getHeight());
        res.setCreatedBy(encounter.getCreatedBy());
        res.setCreatedAt(encounter.getCreatedAt());
        res.setUpdatedAt(encounter.getUpdatedAt());

        // Lấy thông tin Bệnh nhân
        patientRepository.findByIdAndDeletedAtIsNull(encounter.getPatientId()).ifPresent(p -> {
            res.setPatientCode(p.getPatientCode());
            res.setPatientName(p.getFullName());
            res.setPatientPhone(p.getPhone());
            res.setPatientGender(p.getGender());
            res.setPatientDateOfBirth(p.getDateOfBirth() != null ? p.getDateOfBirth().toString() : null);
            res.setPatientAllergies(p.getAllergies());
            res.setPatientMedicalHistory(p.getMedicalHistorySummary());
        });

        // Lấy thông tin Bác sĩ
        staffProfileRepository.findById(encounter.getDoctorId()).ifPresent(doc -> {
            res.setDoctorCode(doc.getStaffCode());
            res.setDoctorName(doc.getFullName());
            if (doc.getSpecialtyId() != null) {
                specialtyRepository.findById(doc.getSpecialtyId())
                        .ifPresent(spec -> res.setDoctorSpecialty(spec.getName()));
            }
        });

        // Lấy mã Lịch hẹn nếu có
        if (encounter.getAppointmentId() != null) {
            appointmentRepository.findById(encounter.getAppointmentId())
                    .ifPresent(apt -> res.setAppointmentCode(apt.getAppointmentCode()));
        }

        // Lấy tên Phòng khám nếu có
        if (encounter.getRoomId() != null) {
            roomRepository.findById(encounter.getRoomId())
                    .ifPresent(r -> res.setRoomName(r.getName()));
        }

        return res;
    }

    private String generateEncounterCode() {
        String datePrefix = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        String randomSuffix = String.format("%04d", new Random().nextInt(10000));
        return "PK-" + datePrefix + "-" + randomSuffix;
    }

    private void recordAudit(String userId, String action, String entityName, String entityId, String note) {
        try {
            AuditLog audit = new AuditLog();
            audit.setUserId(userId);
            audit.setUsername(SecurityContextHelper.getCurrentUsername().orElse("SYSTEM"));
            audit.setRoleName(SecurityContextHelper.getCurrentUser()
                    .map(u -> String.join(",", u.getRoles())).orElse("UNKNOWN"));
            audit.setAction(action);
            audit.setEntityName(entityName);
            audit.setEntityId(entityId);
            audit.setNewValues("{\"note\":\"" + note + "\"}");
            auditLogRepository.save(audit);
        } catch (Exception ignored) {
            // Audit log failure should not break the business flow
        }
    }
}

