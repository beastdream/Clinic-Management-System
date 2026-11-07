package com.clinicmanagement.admin.service;

import com.clinicmanagement.admin.dto.AdminResetPasswordRequest;
import com.clinicmanagement.admin.dto.AdminUserResponse;
import com.clinicmanagement.admin.dto.UpdateUserStatusRequest;
import com.clinicmanagement.audit.entity.AuditLog;
import com.clinicmanagement.audit.repository.AuditLogRepository;
import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.common.exception.ErrorCode;
import com.clinicmanagement.patient.entity.Patient;
import com.clinicmanagement.patient.entity.PatientUserLink;
import com.clinicmanagement.patient.repository.PatientRepository;
import com.clinicmanagement.patient.repository.PatientUserLinkRepository;
import com.clinicmanagement.staff.entity.StaffProfile;
import com.clinicmanagement.staff.repository.StaffProfileRepository;
import com.clinicmanagement.user.entity.Role;
import com.clinicmanagement.user.entity.User;
import com.clinicmanagement.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminUserService {

    private static final Logger log = LoggerFactory.getLogger(AdminUserService.class);

    private final UserRepository userRepository;
    private final StaffProfileRepository staffProfileRepository;
    private final PatientUserLinkRepository patientUserLinkRepository;
    private final PatientRepository patientRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;
    private final SystemSettingService systemSettingService;

    public AdminUserService(UserRepository userRepository,
                            StaffProfileRepository staffProfileRepository,
                            PatientUserLinkRepository patientUserLinkRepository,
                            PatientRepository patientRepository,
                            AuditLogRepository auditLogRepository,
                            PasswordEncoder passwordEncoder,
                            SystemSettingService systemSettingService) {
        this.userRepository = userRepository;
        this.staffProfileRepository = staffProfileRepository;
        this.patientUserLinkRepository = patientUserLinkRepository;
        this.patientRepository = patientRepository;
        this.auditLogRepository = auditLogRepository;
        this.passwordEncoder = passwordEncoder;
        this.systemSettingService = systemSettingService;
    }

    @Transactional(readOnly = true)
    public List<AdminUserResponse> getAllUsers(String search, String status, String roleFilter) {
        List<User> users = userRepository.searchUsers(
                search != null && !search.isBlank() ? search.trim() : null,
                status != null && !status.isBlank() ? status.trim().toUpperCase() : null
        );

        // Preload staff and patient names to avoid N+1 queries
        Map<String, String> staffNameByUserId = staffProfileRepository.findAll().stream()
                .filter(s -> s.getUserId() != null)
                .collect(Collectors.toMap(StaffProfile::getUserId, StaffProfile::getFullName, (existing, replacement) -> existing));

        Map<String, String> patientIdByUserId = patientUserLinkRepository.findAll().stream()
                .filter(l -> l.getUserId() != null && l.getPatientId() != null)
                .collect(Collectors.toMap(PatientUserLink::getUserId, PatientUserLink::getPatientId, (existing, replacement) -> existing));

        Map<String, String> patientNameById = patientRepository.findAll().stream()
                .collect(Collectors.toMap(Patient::getId, Patient::getFullName, (existing, replacement) -> existing));

        return users.stream()
                .map(user -> {
                    List<String> roleCodes = user.getRoles() != null
                            ? user.getRoles().stream().map(Role::getCode).sorted().collect(Collectors.toList())
                            : Collections.emptyList();

                    String fullName = null;
                    if (staffNameByUserId.containsKey(user.getId())) {
                        fullName = staffNameByUserId.get(user.getId());
                    } else if (patientIdByUserId.containsKey(user.getId())) {
                        String patientId = patientIdByUserId.get(user.getId());
                        fullName = patientNameById.get(patientId);
                    }

                    return new AdminUserResponse(
                            user.getId(),
                            user.getUsername(),
                            user.getEmail(),
                            user.getPhone(),
                            user.getStatus(),
                            user.getFailedLoginAttempts(),
                            user.getLockedUntil(),
                            user.isStaff(),
                            user.getAuthProvider(),
                            roleCodes,
                            fullName,
                            user.getCreatedAt(),
                            user.getUpdatedAt()
                    );
                })
                .filter(resp -> {
                    if (roleFilter == null || roleFilter.isBlank()) return true;
                    String target = roleFilter.trim().toUpperCase();
                    return resp.roles().stream().anyMatch(r ->
                            r.equalsIgnoreCase(target) ||
                            r.equalsIgnoreCase("ROLE_" + target) ||
                            ("ROLE_" + r).equalsIgnoreCase(target)
                    );
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public AdminUserResponse unlockUser(String userId, String adminUserId, String adminUsername) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        String oldStatus = user.getStatus();
        int oldAttempts = user.getFailedLoginAttempts();

        user.setStatus("ACTIVE");
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        User saved = userRepository.save(user);

        // Record Audit
        try {
            AuditLog audit = new AuditLog();
            audit.setUserId(adminUserId);
            audit.setUsername(adminUsername != null ? adminUsername : "admin");
            audit.setRoleName("ROLE_ADMIN");
            audit.setAction("UNLOCK_USER");
            audit.setEntityName("users");
            audit.setEntityId(userId);
            audit.setOldValues(String.format("{\"status\":\"%s\",\"failedAttempts\":%d}", oldStatus, oldAttempts));
            audit.setNewValues("{\"status\":\"ACTIVE\",\"failedAttempts\":0,\"lockedUntil\":null}");
            auditLogRepository.save(audit);
        } catch (Exception e) {
            log.warn("Không thể lưu audit log khi mở khóa tài khoản: {}", e.getMessage());
        }

        log.info("Quản trị viên [{}] đã mở khóa tài khoản [{}]", adminUsername, user.getUsername());
        return mapToResponse(saved);
    }

    @Transactional
    public AdminUserResponse updateUserStatus(String userId, UpdateUserStatusRequest request, String adminUserId, String adminUsername) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // Không cho phép Admin tự khóa hoặc ngưng hoạt động tài khoản của chính mình
        if (adminUserId != null && adminUserId.equals(userId) && !"ACTIVE".equalsIgnoreCase(request.status())) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST);
        }

        String oldStatus = user.getStatus();
        user.setStatus(request.status().toUpperCase());

        if ("ACTIVE".equalsIgnoreCase(request.status())) {
            user.setFailedLoginAttempts(0);
            user.setLockedUntil(null);
        }

        User saved = userRepository.save(user);

        // Record Audit
        try {
            AuditLog audit = new AuditLog();
            audit.setUserId(adminUserId);
            audit.setUsername(adminUsername != null ? adminUsername : "admin");
            audit.setRoleName("ROLE_ADMIN");
            audit.setAction("UPDATE_USER_STATUS");
            audit.setEntityName("users");
            audit.setEntityId(userId);
            audit.setOldValues(String.format("{\"status\":\"%s\"}", oldStatus));
            audit.setNewValues(String.format("{\"status\":\"%s\",\"reason\":\"%s\"}",
                    request.status().toUpperCase(), request.reason() != null ? request.reason() : "Admin update"));
            auditLogRepository.save(audit);
        } catch (Exception e) {
            log.warn("Không thể lưu audit log khi cập nhật trạng thái tài khoản: {}", e.getMessage());
        }

        log.info("Quản trị viên [{}] đã cập nhật trạng thái tài khoản [{}] từ {} sang {}",
                adminUsername, user.getUsername(), oldStatus, request.status());
        return mapToResponse(saved);
    }

    @Transactional
    public void resetUserPassword(String userId, AdminResetPasswordRequest request, String adminUserId, String adminUsername) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        int minLen = systemSettingService.getPasswordMinLength();
        if (request.newPassword() == null || request.newPassword().length() < minLen) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST);
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        user.setFailedLoginAttempts(0);
        if ("LOCKED".equalsIgnoreCase(user.getStatus())) {
            user.setStatus("ACTIVE");
            user.setLockedUntil(null);
        }
        userRepository.save(user);

        // Record Audit
        try {
            AuditLog audit = new AuditLog();
            audit.setUserId(adminUserId);
            audit.setUsername(adminUsername != null ? adminUsername : "admin");
            audit.setRoleName("ROLE_ADMIN");
            audit.setAction("ADMIN_RESET_PASSWORD");
            audit.setEntityName("users");
            audit.setEntityId(userId);
            audit.setNewValues("{\"action\":\"PASSWORD_RESET_BY_ADMIN\"}");
            auditLogRepository.save(audit);
        } catch (Exception e) {
            log.warn("Không thể lưu audit log khi đặt lại mật khẩu: {}", e.getMessage());
        }

        log.info("Quản trị viên [{}] đã đặt lại mật khẩu cho tài khoản [{}]", adminUsername, user.getUsername());
    }

    private AdminUserResponse mapToResponse(User user) {
        List<String> roleCodes = user.getRoles() != null
                ? user.getRoles().stream().map(Role::getCode).sorted().collect(Collectors.toList())
                : Collections.emptyList();

        String fullName = staffProfileRepository.findByUserId(user.getId())
                .map(StaffProfile::getFullName)
                .orElseGet(() -> patientUserLinkRepository.findByUserId(user.getId())
                        .flatMap(l -> patientRepository.findById(l.getPatientId()))
                        .map(Patient::getFullName)
                        .orElse(null));

        return new AdminUserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getPhone(),
                user.getStatus(),
                user.getFailedLoginAttempts(),
                user.getLockedUntil(),
                user.isStaff(),
                user.getAuthProvider(),
                roleCodes,
                fullName,
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}

