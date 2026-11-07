package com.clinicmanagement.admin.service;

import com.clinicmanagement.admin.dto.AdminAuditLogDto;
import com.clinicmanagement.audit.entity.AuditLog;
import com.clinicmanagement.audit.repository.AuditLogRepository;
import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.common.exception.ErrorCode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminAuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AdminAuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(readOnly = true)
    public List<AdminAuditLogDto> getAuditLogs(String action, String search, int limit) {
        List<AuditLog> allLogs = auditLogRepository.findAllByOrderByCreatedAtDesc();

        return allLogs.stream()
                .filter(l -> {
                    if (action == null || action.isBlank()) return true;
                    return action.equalsIgnoreCase(l.getAction());
                })
                .filter(l -> {
                    if (search == null || search.isBlank()) return true;
                    String kw = search.trim().toLowerCase();
                    boolean userMatch = l.getUsername() != null && l.getUsername().toLowerCase().contains(kw);
                    boolean entityMatch = l.getEntityName() != null && l.getEntityName().toLowerCase().contains(kw);
                    boolean actionMatch = l.getAction() != null && l.getAction().toLowerCase().contains(kw);
                    return userMatch || entityMatch || actionMatch;
                })
                .limit(limit > 0 ? limit : 100)
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AdminAuditLogDto getAuditLogById(String id) {
        AuditLog log = auditLogRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy nhật ký kiểm toán"));
        return mapToDto(log);
    }

    private AdminAuditLogDto mapToDto(AuditLog l) {
        return new AdminAuditLogDto(
                l.getId(),
                l.getUserId(),
                l.getUsername(),
                l.getRoleName(),
                l.getAction(),
                l.getEntityName(),
                l.getEntityId(),
                l.getOldValues(),
                l.getNewValues(),
                l.getIpAddress(),
                l.getUserAgent(),
                l.getCreatedAt()
        );
    }
}

