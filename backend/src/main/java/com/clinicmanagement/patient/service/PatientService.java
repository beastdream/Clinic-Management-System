package com.clinicmanagement.patient.service;

import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.common.exception.ErrorCode;
import com.clinicmanagement.patient.dto.CreatePatientRequest;
import com.clinicmanagement.patient.dto.PatientResponse;
import com.clinicmanagement.patient.dto.UpdatePatientRequest;
import com.clinicmanagement.patient.entity.Patient;
import com.clinicmanagement.patient.entity.PatientUserLink;
import com.clinicmanagement.patient.repository.PatientRepository;
import com.clinicmanagement.patient.repository.PatientUserLinkRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Service
public class PatientService {

    private static final Logger log = LoggerFactory.getLogger(PatientService.class);

    private final PatientRepository patientRepository;
    private final PatientUserLinkRepository patientUserLinkRepository;

    public PatientService(PatientRepository patientRepository, PatientUserLinkRepository patientUserLinkRepository) {
        this.patientRepository = patientRepository;
        this.patientUserLinkRepository = patientUserLinkRepository;
    }

    /**
     * Liên kết 1-1 hồ sơ bệnh nhân với tài khoản cổng thông tin.
     */
    @Transactional
    public void linkUserAccount(String patientId, String userId) {
        if (patientUserLinkRepository.existsByPatientId(patientId) || patientUserLinkRepository.existsByUserId(userId)) {
            throw new BusinessException(ErrorCode.CONFLICT, "Hồ sơ bệnh nhân hoặc tài khoản đã được liên kết trước đó");
        }
        PatientUserLink link = new PatientUserLink();
        link.setPatientId(patientId);
        link.setUserId(userId);
        patientUserLinkRepository.save(link);
    }

    @Transactional
    public PatientResponse createPatient(CreatePatientRequest request) {
        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            patientRepository.findByPhone(request.getPhone()).ifPresent(p -> {
                if (p.getDeletedAt() == null) {
                    log.warn("Cảnh báo: Bệnh nhân với SĐT [{}] đã tồn tại (mã: {})", request.getPhone(), p.getPatientCode());
                }
            });
        }

        // Sinh mã bệnh nhân duy nhất BN-YYYY-XXXX
        String year = String.valueOf(LocalDate.now().getYear());
        long count = patientRepository.count() + 1;
        String patientCode = String.format("BN-%s-%04d", year, count);
        while (patientRepository.existsByPatientCode(patientCode)) {
            count++;
            patientCode = String.format("BN-%s-%04d", year, count);
        }

        Patient patient = new Patient();
        patient.setPatientCode(patientCode);
        patient.setFullName(request.getFullName().trim());
        patient.setDateOfBirth(request.getDateOfBirth());
        patient.setGender(request.getGender().toUpperCase());
        patient.setPhone(request.getPhone().trim());
        patient.setIdentityCardNo(request.getIdentityCardNo() != null ? request.getIdentityCardNo().trim() : null);
        patient.setEmail(request.getEmail() != null ? request.getEmail().trim() : null);
        patient.setAddress(request.getAddress());
        patient.setEmergencyContactName(request.getEmergencyContactName());
        patient.setEmergencyContactPhone(request.getEmergencyContactPhone());
        patient.setBloodType(request.getBloodType());
        patient.setAllergies(request.getAllergies());
        patient.setMedicalHistorySummary(request.getMedicalHistorySummary());
        patient.setStatus("ACTIVE");

        Patient saved = patientRepository.save(patient);
        log.info("Tạo mới hồ sơ bệnh nhân thành công: [{}] - {}", saved.getPatientCode(), saved.getFullName());
        return PatientResponse.fromEntity(saved);
    }

    @Transactional
    public PatientResponse updatePatient(String id, UpdatePatientRequest request) {
        Patient patient = patientRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.PATIENT_NOT_FOUND));

        patient.setFullName(request.getFullName().trim());
        patient.setDateOfBirth(request.getDateOfBirth());
        patient.setGender(request.getGender().toUpperCase());
        patient.setPhone(request.getPhone().trim());
        patient.setIdentityCardNo(request.getIdentityCardNo() != null ? request.getIdentityCardNo().trim() : null);
        patient.setEmail(request.getEmail() != null ? request.getEmail().trim() : null);
        patient.setAddress(request.getAddress());
        patient.setEmergencyContactName(request.getEmergencyContactName());
        patient.setEmergencyContactPhone(request.getEmergencyContactPhone());
        patient.setBloodType(request.getBloodType());
        patient.setAllergies(request.getAllergies());
        patient.setMedicalHistorySummary(request.getMedicalHistorySummary());
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            patient.setStatus(request.getStatus().toUpperCase());
        }

        Patient updated = patientRepository.save(patient);
        log.info("Cập nhật hồ sơ bệnh nhân thành công: [{}] - {}", updated.getPatientCode(), updated.getFullName());
        return PatientResponse.fromEntity(updated);
    }

    @Transactional
    public void softDeletePatient(String id) {
        Patient patient = patientRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.PATIENT_NOT_FOUND));

        patient.setDeletedAt(Instant.now());
        patient.setStatus("ARCHIVED");
        patientRepository.save(patient);
        log.info("Đã lưu trữ (soft delete) hồ sơ bệnh nhân: [{}] - {}", patient.getPatientCode(), patient.getFullName());
    }

    @Transactional(readOnly = true)
    public Page<PatientResponse> getAllPatients(String search, Pageable pageable) {
        if (search != null && !search.trim().isBlank()) {
            return patientRepository.searchActivePatients(search.trim(), pageable).map(PatientResponse::fromEntity);
        }
        return patientRepository.findByDeletedAtIsNull(pageable).map(PatientResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<PatientResponse> getTopPatients(String search) {
        if (search != null && !search.trim().isBlank()) {
            return patientRepository.searchActivePatientsList(search.trim()).stream()
                    .limit(50)
                    .map(PatientResponse::fromEntity)
                    .toList();
        }
        return patientRepository.findByDeletedAtIsNullOrderByCreatedAtDesc().stream()
                .limit(50)
                .map(PatientResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public PatientResponse getPatientById(String id) {
        Patient patient = patientRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.PATIENT_NOT_FOUND));
        return PatientResponse.fromEntity(patient);
    }

    @Transactional(readOnly = true)
    public PatientResponse getPatientByCode(String code) {
        Patient patient = patientRepository.findByPatientCode(code)
                .filter(p -> p.getDeletedAt() == null)
                .orElseThrow(() -> new BusinessException(ErrorCode.PATIENT_NOT_FOUND));
        return PatientResponse.fromEntity(patient);
    }
}
