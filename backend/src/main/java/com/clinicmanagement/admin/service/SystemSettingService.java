package com.clinicmanagement.admin.service;

import com.clinicmanagement.admin.dto.SystemSettingsDto;
import com.clinicmanagement.admin.dto.UpdateSystemSettingsRequest;
import com.clinicmanagement.admin.entity.SystemSetting;
import com.clinicmanagement.admin.repository.SystemSettingRepository;
import com.clinicmanagement.audit.entity.AuditLog;
import com.clinicmanagement.audit.repository.AuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SystemSettingService {

    private static final Logger log = LoggerFactory.getLogger(SystemSettingService.class);

    public static final String KEY_MAX_FAILED_ATTEMPTS = "security.max_failed_login_attempts";
    public static final String KEY_LOCKOUT_DURATION = "security.lockout_duration_minutes";
    public static final String KEY_PASSWORD_MIN_LENGTH = "security.password_min_length";
    public static final String KEY_MAINTENANCE_MODE = "system.maintenance_mode";
    public static final String KEY_MAINTENANCE_MESSAGE = "system.maintenance_message";
    public static final String KEY_ALLOW_PATIENT_REGISTRATION = "system.allow_patient_registration";

    private final SystemSettingRepository settingRepository;
    private final AuditLogRepository auditLogRepository;

    public SystemSettingService(SystemSettingRepository settingRepository, AuditLogRepository auditLogRepository) {
        this.settingRepository = settingRepository;
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(readOnly = true)
    public SystemSettingsDto getSettings() {
        return new SystemSettingsDto(
                getMaxFailedLoginAttempts(),
                getLockoutDurationMinutes(),
                getPasswordMinLength(),
                isMaintenanceMode(),
                getMaintenanceMessage(),
                isAllowPatientRegistration()
        );
    }

    @Transactional
    public SystemSettingsDto updateSettings(UpdateSystemSettingsRequest request, String adminUserId, String adminUsername) {
        SystemSettingsDto oldSettings = getSettings();

        if (request.maxFailedLoginAttempts() != null) {
            saveOrUpdate(KEY_MAX_FAILED_ATTEMPTS, String.valueOf(request.maxFailedLoginAttempts()), "SECURITY", "Số lần đăng nhập sai tối đa trước khi tạm khóa tài khoản");
        }
        if (request.lockoutDurationMinutes() != null) {
            saveOrUpdate(KEY_LOCKOUT_DURATION, String.valueOf(request.lockoutDurationMinutes()), "SECURITY", "Thời gian tạm khóa tài khoản khi vượt quá số lần nhập sai (phút)");
        }
        if (request.passwordMinLength() != null) {
            saveOrUpdate(KEY_PASSWORD_MIN_LENGTH, String.valueOf(request.passwordMinLength()), "SECURITY", "Độ dài tối thiểu của mật khẩu người dùng");
        }
        if (request.maintenanceMode() != null) {
            saveOrUpdate(KEY_MAINTENANCE_MODE, String.valueOf(request.maintenanceMode()), "MAINTENANCE", "Chế độ bảo trì toàn hệ thống (chỉ Quản trị viên được truy cập)");
        }
        if (request.maintenanceMessage() != null && !request.maintenanceMessage().isBlank()) {
            saveOrUpdate(KEY_MAINTENANCE_MESSAGE, request.maintenanceMessage().trim(), "MAINTENANCE", "Thông báo hiển thị cho người dùng khi bảo trì");
        }
        if (request.allowPatientRegistration() != null) {
            saveOrUpdate(KEY_ALLOW_PATIENT_REGISTRATION, String.valueOf(request.allowPatientRegistration()), "GENERAL", "Cho phép bệnh nhân mới tự đăng ký tài khoản qua cổng trực tuyến");
        }

        SystemSettingsDto newSettings = getSettings();

        // Ghi Audit Log
        try {
            AuditLog audit = new AuditLog();
            audit.setUserId(adminUserId);
            audit.setUsername(adminUsername != null ? adminUsername : "admin");
            audit.setRoleName("ROLE_ADMIN");
            audit.setAction("UPDATE_SYSTEM_SETTINGS");
            audit.setEntityName("system_settings");
            audit.setEntityId("SYSTEM");
            audit.setOldValues(String.format("{\"maxFailedAttempts\":%d,\"lockoutMinutes\":%d,\"maintenance\":%b}",
                    oldSettings.maxFailedLoginAttempts(), oldSettings.lockoutDurationMinutes(), oldSettings.maintenanceMode()));
            audit.setNewValues(String.format("{\"maxFailedAttempts\":%d,\"lockoutMinutes\":%d,\"maintenance\":%b}",
                    newSettings.maxFailedLoginAttempts(), newSettings.lockoutDurationMinutes(), newSettings.maintenanceMode()));
            auditLogRepository.save(audit);
        } catch (Exception e) {
            log.warn("Không thể lưu audit log khi cập nhật cấu hình hệ thống: {}", e.getMessage());
        }

        log.info("Quản trị viên [{}] đã cập nhật cấu hình hệ thống", adminUsername);
        return newSettings;
    }

    private void saveOrUpdate(String key, String value, String group, String description) {
        SystemSetting setting = settingRepository.findBySettingKey(key)
                .orElseGet(() -> new SystemSetting(key, value, group, description));
        setting.setSettingValue(value);
        setting.setSettingGroup(group);
        if (description != null) {
            setting.setDescription(description);
        }
        settingRepository.save(setting);
    }

    public int getMaxFailedLoginAttempts() {
        return getIntSetting(KEY_MAX_FAILED_ATTEMPTS, 5);
    }

    public int getLockoutDurationMinutes() {
        return getIntSetting(KEY_LOCKOUT_DURATION, 15);
    }

    public int getPasswordMinLength() {
        return getIntSetting(KEY_PASSWORD_MIN_LENGTH, 8);
    }

    public boolean isMaintenanceMode() {
        return getBooleanSetting(KEY_MAINTENANCE_MODE, false);
    }

    public String getMaintenanceMessage() {
        return getStringSetting(KEY_MAINTENANCE_MESSAGE, "Hệ thống phòng khám đang bảo trì định kỳ để nâng cấp. Vui lòng quay lại sau.");
    }

    public boolean isAllowPatientRegistration() {
        return getBooleanSetting(KEY_ALLOW_PATIENT_REGISTRATION, true);
    }

    private int getIntSetting(String key, int defaultValue) {
        try {
            return settingRepository.findBySettingKey(key)
                    .map(s -> Integer.parseInt(s.getSettingValue().trim()))
                    .orElse(defaultValue);
        } catch (Exception e) {
            return defaultValue;
        }
    }

    private boolean getBooleanSetting(String key, boolean defaultValue) {
        try {
            return settingRepository.findBySettingKey(key)
                    .map(s -> Boolean.parseBoolean(s.getSettingValue().trim()))
                    .orElse(defaultValue);
        } catch (Exception e) {
            return defaultValue;
        }
    }

    private String getStringSetting(String key, String defaultValue) {
        try {
            return settingRepository.findBySettingKey(key)
                    .map(SystemSetting::getSettingValue)
                    .orElse(defaultValue);
        } catch (Exception e) {
            return defaultValue;
        }
    }
}

