package com.clinicmanagement.admin.service;

import com.clinicmanagement.admin.dto.StaffDtos.*;
import com.clinicmanagement.audit.entity.AuditLog;
import com.clinicmanagement.audit.repository.AuditLogRepository;
import com.clinicmanagement.clinic.entity.Room;
import com.clinicmanagement.clinic.entity.Specialty;
import com.clinicmanagement.clinic.repository.RoomRepository;
import com.clinicmanagement.clinic.repository.SpecialtyRepository;
import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.common.exception.ErrorCode;
import com.clinicmanagement.staff.entity.StaffProfile;
import com.clinicmanagement.staff.repository.StaffProfileRepository;
import com.clinicmanagement.user.entity.Role;
import com.clinicmanagement.user.entity.User;
import com.clinicmanagement.user.repository.RoleRepository;
import com.clinicmanagement.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminStaffService {

    private final StaffProfileRepository staffProfileRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final SpecialtyRepository specialtyRepository;
    private final RoomRepository roomRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminStaffService(StaffProfileRepository staffProfileRepository,
                             UserRepository userRepository,
                             RoleRepository roleRepository,
                             SpecialtyRepository specialtyRepository,
                             RoomRepository roomRepository,
                             AuditLogRepository auditLogRepository,
                             PasswordEncoder passwordEncoder) {
        this.staffProfileRepository = staffProfileRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.specialtyRepository = specialtyRepository;
        this.roomRepository = roomRepository;
        this.auditLogRepository = auditLogRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<AdminStaffDto> getAllStaff() {
        List<StaffProfile> profiles = staffProfileRepository.findAll();
        Map<String, Specialty> specialtyMap = specialtyRepository.findAll().stream()
                .collect(Collectors.toMap(Specialty::getId, s -> s, (a, b) -> a));
        Map<String, Room> roomMap = roomRepository.findAll().stream()
                .collect(Collectors.toMap(Room::getId, r -> r, (a, b) -> a));
        Map<String, User> userMap = userRepository.findAll().stream()
                .collect(Collectors.toMap(User::getId, u -> u, (a, b) -> a));

        return profiles.stream().map(sp -> {
            User user = userMap.get(sp.getUserId());
            String username = user != null ? user.getUsername() : "—";
            String email = user != null ? user.getEmail() : null;
            List<String> roles = user != null && user.getRoles() != null
                    ? user.getRoles().stream().map(Role::getCode).sorted().collect(Collectors.toList())
                    : Collections.emptyList();

            String specName = sp.getSpecialtyId() != null && specialtyMap.containsKey(sp.getSpecialtyId())
                    ? specialtyMap.get(sp.getSpecialtyId()).getName()
                    : "—";

            String roomName = sp.getRoomId() != null && roomMap.containsKey(sp.getRoomId())
                    ? roomMap.get(sp.getRoomId()).getName()
                    : "—";

            return new AdminStaffDto(
                    sp.getId(),
                    sp.getUserId(),
                    username,
                    sp.getStaffCode(),
                    sp.getFullName(),
                    sp.getGender(),
                    sp.getDateOfBirth(),
                    sp.getPhone(),
                    email,
                    sp.getSpecialtyId(),
                    specName,
                    sp.getRoomId(),
                    roomName,
                    sp.getLicenseNumber(),
                    sp.getQualification(),
                    sp.getStatus() != null ? sp.getStatus() : "ACTIVE",
                    roles,
                    sp.getCreatedAt()
            );
        }).collect(Collectors.toList());
    }

    @Transactional
    public AdminStaffDto createStaff(CreateStaffRequest req, String adminUsername) {
        String username = req.username().trim();
        String staffCode = req.staffCode().trim().toUpperCase();

        if (userRepository.existsByUsername(username)) {
            throw new BusinessException(ErrorCode.USERNAME_ALREADY_EXISTS, "Tên đăng nhập [" + username + "] đã được sử dụng");
        }
        if (staffProfileRepository.existsByStaffCode(staffCode)) {
            throw new BusinessException(ErrorCode.CONFLICT, "Mã nhân viên [" + staffCode + "] đã tồn tại");
        }

        // Tạo User
        User user = new User();
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(req.password()));
        user.setEmail(req.email() != null && !req.email().isBlank() ? req.email().trim().toLowerCase() : null);
        user.setPhone(req.phone().trim());
        user.setStaff(true);
        user.setStatus("ACTIVE");
        user.setEmailVerifiedAt(Instant.now()); // Nhân viên do Admin tạo được kích hoạt luôn

        // Gán vai trò
        Set<Role> roles = new HashSet<>();
        for (String roleCode : req.roles()) {
            String code = roleCode.startsWith("ROLE_") ? roleCode : "ROLE_" + roleCode;
            roleRepository.findByCode(code).ifPresent(roles::add);
        }
        if (roles.isEmpty()) {
            roleRepository.findByCode("ROLE_DOCTOR").ifPresent(roles::add);
        }
        user.setRoles(roles);
        User savedUser = userRepository.save(user);

        // Tạo StaffProfile
        StaffProfile sp = new StaffProfile();
        sp.setUserId(savedUser.getId());
        sp.setStaffCode(staffCode);
        sp.setFullName(req.fullName().trim());
        sp.setGender(req.gender().toUpperCase());
        sp.setDateOfBirth(req.dateOfBirth());
        sp.setPhone(req.phone().trim());
        sp.setSpecialtyId(req.specialtyId() != null && !req.specialtyId().isBlank() ? req.specialtyId() : null);
        sp.setRoomId(req.roomId() != null && !req.roomId().isBlank() ? req.roomId() : null);
        sp.setLicenseNumber(req.licenseNumber() != null ? req.licenseNumber().trim() : null);
        sp.setQualification(req.qualification() != null ? req.qualification().trim() : null);
        sp.setStatus("ACTIVE");
        StaffProfile savedProfile = staffProfileRepository.save(sp);

        recordAudit(adminUsername, "CREATE", "staff_profiles", savedProfile.getId(),
                "Tạo nhân sự: " + savedProfile.getFullName() + " [" + staffCode + "]");

        return getAllStaff().stream().filter(s -> s.id().equals(savedProfile.getId())).findFirst().orElse(null);
    }

    @Transactional
    public AdminStaffDto updateStaff(String id, UpdateStaffRequest req, String adminUsername) {
        StaffProfile sp = staffProfileRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy hồ sơ nhân sự"));

        sp.setFullName(req.fullName().trim());
        sp.setGender(req.gender().toUpperCase());
        sp.setDateOfBirth(req.dateOfBirth());
        sp.setPhone(req.phone().trim());
        sp.setSpecialtyId(req.specialtyId() != null && !req.specialtyId().isBlank() ? req.specialtyId() : null);
        sp.setRoomId(req.roomId() != null && !req.roomId().isBlank() ? req.roomId() : null);
        sp.setLicenseNumber(req.licenseNumber() != null ? req.licenseNumber().trim() : null);
        sp.setQualification(req.qualification() != null ? req.qualification().trim() : null);
        if (req.status() != null && !req.status().isBlank()) {
            sp.setStatus(req.status().toUpperCase());
        }
        StaffProfile saved = staffProfileRepository.save(sp);

        // Cập nhật tài khoản User liên kết
        userRepository.findById(sp.getUserId()).ifPresent(user -> {
            user.setPhone(req.phone().trim());
            if (req.email() != null && !req.email().isBlank()) {
                user.setEmail(req.email().trim().toLowerCase());
            }
            if (req.roles() != null && !req.roles().isEmpty()) {
                Set<Role> roles = new HashSet<>();
                for (String roleCode : req.roles()) {
                    String code = roleCode.startsWith("ROLE_") ? roleCode : "ROLE_" + roleCode;
                    roleRepository.findByCode(code).ifPresent(roles::add);
                }
                user.setRoles(roles);
            }
            if ("TERMINATED".equalsIgnoreCase(req.status())) {
                user.setStatus("SUSPENDED");
            } else if ("ACTIVE".equalsIgnoreCase(req.status())) {
                user.setStatus("ACTIVE");
            }
            userRepository.save(user);
        });

        recordAudit(adminUsername, "UPDATE", "staff_profiles", saved.getId(),
                "Cập nhật nhân sự: " + saved.getFullName());

        return getAllStaff().stream().filter(s -> s.id().equals(saved.getId())).findFirst().orElse(null);
    }

    @Transactional
    public void updateStaffStatus(String id, String status, String adminUsername) {
        StaffProfile sp = staffProfileRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy hồ sơ nhân sự"));

        sp.setStatus(status.toUpperCase());
        staffProfileRepository.save(sp);

        userRepository.findById(sp.getUserId()).ifPresent(user -> {
            if ("TERMINATED".equalsIgnoreCase(status)) {
                user.setStatus("SUSPENDED");
            } else if ("ACTIVE".equalsIgnoreCase(status)) {
                user.setStatus("ACTIVE");
            }
            userRepository.save(user);
        });

        recordAudit(adminUsername, "UPDATE", "staff_profiles", sp.getId(),
                "Đổi trạng thái nhân sự: " + sp.getFullName() + " sang " + status);
    }

    private void recordAudit(String username, String action, String entityName, String entityId, String details) {
        try {
            AuditLog log = new AuditLog();
            log.setUsername(username != null ? username : "admin");
            log.setRoleName("ROLE_ADMIN");
            log.setAction(action);
            log.setEntityName(entityName);
            log.setEntityId(entityId);
            log.setNewValues("{\"details\":\"" + details + "\"}");
            auditLogRepository.save(log);
        } catch (Exception ignored) {}
    }
}

