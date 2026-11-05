package com.clinicmanagement.auth.service;

import com.clinicmanagement.auth.dto.AuthResponse;
import com.clinicmanagement.audit.entity.AuditLog;
import com.clinicmanagement.audit.repository.AuditLogRepository;
import com.clinicmanagement.auth.dto.LoginRequest;
import com.clinicmanagement.auth.dto.RegisterRequest;
import com.clinicmanagement.patient.dto.CreatePatientRequest;
import com.clinicmanagement.patient.dto.PatientResponse;
import com.clinicmanagement.patient.service.PatientService;
import com.clinicmanagement.user.entity.Role;
import com.clinicmanagement.user.repository.RoleRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import com.clinicmanagement.auth.dto.GoogleAuthDtos.AuthProvidersResponse;
import com.clinicmanagement.auth.dto.GoogleAuthDtos.GoogleAuthResult;
import com.clinicmanagement.auth.dto.GoogleAuthDtos.GoogleRegisterRequest;
import com.clinicmanagement.auth.dto.GoogleAuthDtos.RegistrationResult;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.util.Optional;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;
import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.common.exception.ErrorCode;
import com.clinicmanagement.security.CustomUserDetailsService;
import com.clinicmanagement.security.JwtTokenProvider;
import com.clinicmanagement.security.SecurityContextHelper;
import com.clinicmanagement.security.UserPrincipal;
import com.clinicmanagement.user.entity.User;
import com.clinicmanagement.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private static final String PATIENT_ROLE_CODE = "ROLE_PATIENT";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final CustomUserDetailsService userDetailsService;
    private final PatientService patientService;
    private final AuditLogRepository auditLogRepository;
    private final EmailVerificationService emailVerificationService;
    private final GoogleTokenVerifier googleTokenVerifier;

    @Value("${app.jwt.expiration-ms:900000}")
    private long jwtExpirationMs;

    public AuthService(UserRepository userRepository, RoleRepository roleRepository, PasswordEncoder passwordEncoder,
                       JwtTokenProvider tokenProvider, CustomUserDetailsService userDetailsService,
                       PatientService patientService, AuditLogRepository auditLogRepository,
                       EmailVerificationService emailVerificationService, GoogleTokenVerifier googleTokenVerifier) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.userDetailsService = userDetailsService;
        this.patientService = patientService;
        this.auditLogRepository = auditLogRepository;
        this.emailVerificationService = emailVerificationService;
        this.googleTokenVerifier = googleTokenVerifier;
    }

    /**
     * Bệnh nhân tự đăng ký: tạo tài khoản ROLE_PATIENT + hồ sơ bệnh nhân mới + liên kết 1-1,
     * sau đó gửi email xác thực. Chỉ đăng nhập được sau khi đã xác thực email.
     * Không tự gắn vào hồ sơ có sẵn (dù trùng SĐT) để tránh chiếm quyền xem bệnh án của người khác;
     * việc hợp nhất hồ sơ do tiếp tân xác minh giấy tờ tại quầy.
     */
    @Transactional
    public RegistrationResult register(RegisterRequest request) {
        String username = request.username().trim();
        String email = request.email().trim().toLowerCase();

        if (userRepository.existsByUsername(username)) {
            throw new BusinessException(ErrorCode.USERNAME_ALREADY_EXISTS);
        }
        if (userRepository.existsByEmail(email)) {
            throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        User user = new User();
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setAuthProvider("LOCAL");
        user.setEmail(email);
        user.setPhone(request.phone().trim());
        User savedUser = createPatientAccount(user, request.fullName(), request.dateOfBirth(), request.gender(),
                request.phone(), "PATIENT_SELF_REGISTER");

        emailVerificationService.issueAndSend(savedUser, request.fullName().trim());
        return new RegistrationResult(email, true);
    }

    /** Lưu User ROLE_PATIENT, tạo hồ sơ bệnh nhân mới và liên kết 1-1, ghi audit. */
    private User createPatientAccount(User user, String fullName, LocalDate dateOfBirth, String gender,
                                      String phone, String auditEvent) {
        Role patientRole = roleRepository.findByCode(PATIENT_ROLE_CODE)
                .orElseThrow(() -> new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR, "Chưa cấu hình vai trò Bệnh nhân trong hệ thống"));
        user.setStatus("ACTIVE");
        user.setStaff(false);
        user.setRoles(new HashSet<>(Set.of(patientRole)));
        User savedUser = userRepository.save(user);

        CreatePatientRequest patientRequest = new CreatePatientRequest();
        patientRequest.setFullName(fullName);
        patientRequest.setDateOfBirth(dateOfBirth);
        patientRequest.setGender(gender);
        patientRequest.setPhone(phone);
        patientRequest.setEmail(savedUser.getEmail());
        PatientResponse patient = patientService.createPatient(patientRequest);
        patientService.linkUserAccount(patient.getId(), savedUser.getId());

        recordAudit(savedUser.getId(), savedUser.getUsername(), PATIENT_ROLE_CODE, "CREATE", "users", savedUser.getId(),
                "{\"event\":\"" + auditEvent + "\",\"patientCode\":\"" + patient.getPatientCode() + "\"}");
        log.info("Tạo tài khoản bệnh nhân [{}] ({}) liên kết hồ sơ [{}]", savedUser.getUsername(), auditEvent, patient.getPatientCode());
        return savedUser;
    }

    /** Xác thực email từ link trong thư. Không tự đăng nhập để link cũ bị lộ không dùng được để vào tài khoản. */
    @Transactional(noRollbackFor = BusinessException.class)
    public String verifyEmail(String token) {
        User user = emailVerificationService.verify(token);
        recordAudit(user.getId(), user.getUsername(), rolesOf(user), "UPDATE", "users", user.getId(),
                "{\"event\":\"EMAIL_VERIFIED\"}");
        return user.getEmail();
    }

    public void resendVerificationEmail(String email) {
        emailVerificationService.resend(email);
    }

    public AuthProvidersResponse getProviders() {
        return new AuthProvidersResponse(googleTokenVerifier.isEnabled(),
                googleTokenVerifier.isEnabled() ? googleTokenVerifier.getClientId() : null);
    }

    /**
     * Đăng nhập bằng Google. Tài khoản đã liên kết -> cấp token; email trùng tài khoản bệnh nhân -> liên kết rồi cấp token;
     * chưa có tài khoản -> yêu cầu bổ sung hồ sơ (ngày sinh, giới tính, SĐT) qua googleRegister.
     */
    @Transactional(noRollbackFor = BusinessException.class)
    public GoogleAuthResult googleLogin(String credential) {
        GoogleTokenVerifier.GoogleUser google = verifyGoogle(credential);

        Optional<User> existing = userRepository.findByGoogleSubject(google.subject())
                .or(() -> userRepository.findByEmail(google.email()));
        if (existing.isEmpty()) {
            return GoogleAuthResult.needsProfile(google.email(), google.fullName());
        }

        User user = existing.get();
        if (user.isStaff()) {
            recordAudit(user.getId(), user.getUsername(), rolesOf(user), "LOGIN_FAILED", "users", user.getId(),
                    "{\"reason\":\"GOOGLE_STAFF_NOT_ALLOWED\"}");
            throw new BusinessException(ErrorCode.GOOGLE_STAFF_NOT_ALLOWED);
        }
        if (user.getGoogleSubject() == null) {
            // Google đã xác minh quyền sở hữu email -> liên kết với tài khoản bệnh nhân sẵn có
            user.setGoogleSubject(google.subject());
            recordAudit(user.getId(), user.getUsername(), rolesOf(user), "UPDATE", "users", user.getId(),
                    "{\"event\":\"GOOGLE_ACCOUNT_LINKED\"}");
        } else if (!user.getGoogleSubject().equals(google.subject())) {
            throw new BusinessException(ErrorCode.GOOGLE_TOKEN_INVALID);
        }
        if (!user.isEmailVerified()) {
            // Tài khoản tạo bằng email này nhưng chưa từng xác thực: có thể do người khác đăng ký trước.
            // Hủy mật khẩu cũ để chỉ chủ sở hữu email (đã được Google xác minh) truy cập được.
            if (user.getPasswordHash() != null) {
                user.setPasswordHash(null);
                user.setAuthProvider("GOOGLE");
                recordAudit(user.getId(), user.getUsername(), rolesOf(user), "UPDATE", "users", user.getId(),
                        "{\"event\":\"UNVERIFIED_PASSWORD_REVOKED_BY_GOOGLE_LINK\"}");
            }
            user.setEmailVerifiedAt(Instant.now());
        }
        ensureCanLogin(user);
        return GoogleAuthResult.loggedIn(completeLogin(user, "GOOGLE"));
    }

    /** Lần đầu đăng nhập Google: tạo tài khoản + hồ sơ bệnh nhân với thông tin bổ sung. */
    @Transactional
    public AuthResponse googleRegister(GoogleRegisterRequest request) {
        GoogleTokenVerifier.GoogleUser google = verifyGoogle(request.credential());
        if (userRepository.findByGoogleSubject(google.subject()).isPresent() || userRepository.existsByEmail(google.email())) {
            throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS,
                    "Email Google này đã có tài khoản, vui lòng chọn \"Tiếp tục với Google\" để đăng nhập");
        }

        User user = new User();
        user.setUsername(generateUsernameFromEmail(google.email()));
        user.setPasswordHash(null);
        user.setAuthProvider("GOOGLE");
        user.setGoogleSubject(google.subject());
        user.setEmail(google.email());
        user.setEmailVerifiedAt(Instant.now());
        user.setPhone(request.phone().trim());
        User savedUser = createPatientAccount(user, request.fullName(), request.dateOfBirth(), request.gender(),
                request.phone(), "PATIENT_GOOGLE_REGISTER");
        return completeLogin(savedUser, "GOOGLE");
    }

    private GoogleTokenVerifier.GoogleUser verifyGoogle(String credential) {
        GoogleTokenVerifier.GoogleUser google = googleTokenVerifier.verify(credential);
        if (google.email() == null || !google.emailVerified()) {
            throw new BusinessException(ErrorCode.GOOGLE_EMAIL_NOT_VERIFIED);
        }
        return google;
    }

    private String generateUsernameFromEmail(String email) {
        String base = email.substring(0, email.indexOf('@')).replaceAll("[^a-zA-Z0-9._]", "");
        if (base.length() < 4) {
            base = (base + "user").substring(0, Math.max(4, base.length()));
        }
        base = truncate(base, 40);
        String candidate = base;
        while (userRepository.existsByUsername(candidate)) {
            candidate = base + "_" + (1000 + RANDOM.nextInt(9000));
        }
        return candidate;
    }

    private void ensureCanLogin(User user) {
        if ("LOCKED".equalsIgnoreCase(user.getStatus())) {
            if (user.getLockedUntil() != null && Instant.now().isBefore(user.getLockedUntil())) {
                throw new BusinessException(ErrorCode.ACCOUNT_LOCKED);
            }
            user.setStatus("ACTIVE");
        }
        if (!user.isAccountActive()) {
            throw new BusinessException(ErrorCode.ACCOUNT_SUSPENDED);
        }
    }

    private AuthResponse completeLogin(User user, String method) {
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        userRepository.save(user);
        recordAudit(user.getId(), user.getUsername(), rolesOf(user), "LOGIN", "users", user.getId(),
                "{\"method\":\"" + method + "\"}");
        return buildTokenResponse(user);
    }

    // noRollbackFor: vẫn lưu số lần đăng nhập sai / trạng thái khóa khi ném lỗi nghiệp vụ
    @Transactional(noRollbackFor = BusinessException.class)
    public AuthResponse login(LoginRequest request) {
        String identifier = request.getUsername().trim();
        User user = userRepository.findByUsername(identifier)
                .or(() -> userRepository.findByEmail(identifier.toLowerCase()))
                .orElseThrow(() -> {
                    recordAudit(null, truncate(identifier, 50), "UNKNOWN", "LOGIN_FAILED", "users", null,
                            "{\"reason\":\"USER_NOT_FOUND\"}");
                    return new BusinessException(ErrorCode.INVALID_CREDENTIALS);
                });

        // Kiểm tra khóa tài khoản
        if ("LOCKED".equalsIgnoreCase(user.getStatus())) {
            if (user.getLockedUntil() != null && Instant.now().isBefore(user.getLockedUntil())) {
                log.warn("Tài khoản [{}] đang bị khóa đến [{}]", user.getUsername(), user.getLockedUntil());
                throw new BusinessException(ErrorCode.ACCOUNT_LOCKED);
            } else {
                // Hết thời gian khóa -> mở lại
                user.setStatus("ACTIVE");
                user.setFailedLoginAttempts(0);
                user.setLockedUntil(null);
            }
        }

        if (!user.isAccountActive()) {
            throw new BusinessException(ErrorCode.ACCOUNT_SUSPENDED);
        }

        if (user.getPasswordHash() == null) {
            throw new BusinessException(ErrorCode.PASSWORD_LOGIN_NOT_AVAILABLE);
        }

        // Kiểm tra mật khẩu
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            int attempts = user.getFailedLoginAttempts() + 1;
            user.setFailedLoginAttempts(attempts);

            if (attempts >= 5) {
                user.setStatus("LOCKED");
                user.setLockedUntil(Instant.now().plus(15, ChronoUnit.MINUTES));
                userRepository.save(user);
                recordAudit(user.getId(), user.getUsername(), rolesOf(user), "ACCOUNT_LOCKED", "users", user.getId(),
                        "{\"failedAttempts\":" + attempts + "}");
                log.warn("Tài khoản [{}] bị khóa 15 phút do nhập sai mật khẩu 5 lần", user.getUsername());
                throw new BusinessException(ErrorCode.ACCOUNT_LOCKED);
            }

            userRepository.save(user);
            recordAudit(user.getId(), user.getUsername(), rolesOf(user), "LOGIN_FAILED", "users", user.getId(),
                    "{\"failedAttempts\":" + attempts + "}");
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }

        // Mật khẩu đúng nhưng bệnh nhân chưa xác thực email -> chưa cho đăng nhập (nhân viên do Admin cấp, không áp dụng)
        if (!user.isStaff() && !user.isEmailVerified()) {
            user.setFailedLoginAttempts(0);
            userRepository.save(user);
            throw new BusinessException(ErrorCode.EMAIL_NOT_VERIFIED);
        }

        // Đăng nhập thành công -> Reset số lần đăng nhập sai
        return completeLogin(user, "PASSWORD");
    }

    private AuthResponse buildTokenResponse(User user) {
        UserPrincipal principal = UserPrincipal.create(user);
        String accessToken = tokenProvider.generateAccessToken(principal);
        String refreshToken = tokenProvider.generateRefreshToken(principal);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresInMs(jwtExpirationMs)
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .isStaff(user.isStaff())
                .roles(principal.getRoles())
                .permissions(principal.getPermissions())
                .build();
    }

    @Transactional(readOnly = true)
    public AuthResponse refreshToken(String refreshToken) {
        if (!tokenProvider.validateToken(refreshToken)) {
            throw new BusinessException(ErrorCode.TOKEN_INVALID);
        }

        String userId = tokenProvider.getUserIdFromToken(refreshToken);
        UserPrincipal principal = (UserPrincipal) userDetailsService.loadUserById(userId);

        String newAccessToken = tokenProvider.generateAccessToken(principal);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresInMs(jwtExpirationMs)
                .userId(principal.getId())
                .username(principal.getUsername())
                .email(principal.getEmail())
                .isStaff(principal.isStaff())
                .roles(principal.getRoles())
                .permissions(principal.getPermissions())
                .build();
    }

    private String rolesOf(User user) {
        return user.getRoles().stream().map(Role::getCode).sorted().collect(Collectors.joining(","));
    }

    private static String truncate(String value, int max) {
        return value.length() <= max ? value : value.substring(0, max);
    }

    private void recordAudit(String userId, String username, String roleName, String action,
                             String entityName, String entityId, String newValuesJson) {
        try {
            AuditLog audit = new AuditLog();
            audit.setUserId(userId);
            audit.setUsername(username);
            audit.setRoleName(truncate(roleName == null || roleName.isBlank() ? "UNKNOWN" : roleName, 50));
            audit.setAction(action);
            audit.setEntityName(entityName);
            audit.setEntityId(entityId);
            audit.setNewValues(newValuesJson);
            if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attrs) {
                HttpServletRequest http = attrs.getRequest();
                String forwarded = http.getHeader("X-Forwarded-For");
                audit.setIpAddress(truncate(forwarded != null ? forwarded.split(",")[0].trim() : http.getRemoteAddr(), 45));
                String ua = http.getHeader("User-Agent");
                audit.setUserAgent(ua != null ? truncate(ua, 255) : null);
            }
            auditLogRepository.save(audit);
        } catch (Exception ex) {
            // Không làm gián đoạn nghiệp vụ xác thực nếu ghi audit lỗi
            log.error("Không ghi được audit log [{}] cho [{}]: {}", action, username, ex.getMessage());
        }
    }

    public AuthResponse getCurrentUserInfo() {
        UserPrincipal principal = SecurityContextHelper.getCurrentUser()
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));

        return AuthResponse.builder()
                .userId(principal.getId())
                .username(principal.getUsername())
                .email(principal.getEmail())
                .isStaff(principal.isStaff())
                .roles(principal.getRoles())
                .permissions(principal.getPermissions())
                .build();
    }
}
