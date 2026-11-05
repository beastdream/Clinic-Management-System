package com.clinicmanagement.auth.service;

import com.clinicmanagement.audit.repository.AuditLogRepository;
import com.clinicmanagement.auth.dto.AuthResponse;
import com.clinicmanagement.auth.dto.GoogleAuthDtos.GoogleAuthResult;
import com.clinicmanagement.auth.dto.GoogleAuthDtos.GoogleRegisterRequest;
import com.clinicmanagement.auth.dto.GoogleAuthDtos.RegistrationResult;
import com.clinicmanagement.auth.dto.LoginRequest;
import com.clinicmanagement.auth.dto.RegisterRequest;
import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.common.exception.ErrorCode;
import com.clinicmanagement.patient.dto.CreatePatientRequest;
import com.clinicmanagement.patient.dto.PatientResponse;
import com.clinicmanagement.patient.service.PatientService;
import com.clinicmanagement.security.CustomUserDetailsService;
import com.clinicmanagement.security.JwtTokenProvider;
import com.clinicmanagement.user.entity.Role;
import com.clinicmanagement.user.entity.User;
import com.clinicmanagement.user.repository.RoleRepository;
import com.clinicmanagement.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock UserRepository userRepository;
    @Mock RoleRepository roleRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtTokenProvider tokenProvider;
    @Mock CustomUserDetailsService userDetailsService;
    @Mock PatientService patientService;
    @Mock AuditLogRepository auditLogRepository;
    @Mock EmailVerificationService emailVerificationService;
    @Mock GoogleTokenVerifier googleTokenVerifier;

    AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, roleRepository, passwordEncoder, tokenProvider,
                userDetailsService, patientService, auditLogRepository, emailVerificationService, googleTokenVerifier);
    }

    private RegisterRequest validRequest() {
        return new RegisterRequest("benhnhan_moi", "Matkhau@123", "Trần Văn Thử",
                LocalDate.of(1995, 5, 20), "MALE", "0912345678", "Thu.Nghiem@Example.com");
    }

    private Role patientRole() {
        Role role = new Role();
        role.setId("role-patient");
        role.setCode("ROLE_PATIENT");
        role.setName("Bệnh nhân");
        return role;
    }

    private User patientUser(boolean emailVerified) {
        User user = new User();
        user.setId("user-1");
        user.setUsername("benhnhan_moi");
        user.setEmail("thu.nghiem@example.com");
        user.setPasswordHash("hashed");
        user.setEmailVerifiedAt(emailVerified ? Instant.now() : null);
        user.getRoles().add(patientRole());
        return user;
    }

    private void stubPatientCreation() {
        when(roleRepository.findByCode("ROLE_PATIENT")).thenReturn(Optional.of(patientRole()));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            if (u.getId() == null) u.setId("user-1");
            return u;
        });
        PatientResponse patient = new PatientResponse();
        patient.setId("patient-1");
        patient.setPatientCode("BN-2026-0026");
        when(patientService.createPatient(any(CreatePatientRequest.class))).thenReturn(patient);
    }

    // ---------- Đăng ký bằng mật khẩu ----------

    @Test
    void register_createsUnverifiedPatientAndSendsVerificationEmail() {
        when(userRepository.existsByUsername("benhnhan_moi")).thenReturn(false);
        when(userRepository.existsByEmail("thu.nghiem@example.com")).thenReturn(false);
        when(passwordEncoder.encode("Matkhau@123")).thenReturn("hashed");
        stubPatientCreation();

        RegistrationResult result = authService.register(validRequest());

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User saved = userCaptor.getValue();
        assertThat(saved.getPasswordHash()).isEqualTo("hashed");
        assertThat(saved.isStaff()).isFalse();
        assertThat(saved.isEmailVerified()).isFalse();
        assertThat(saved.getEmail()).isEqualTo("thu.nghiem@example.com");
        assertThat(saved.getRoles()).extracting(Role::getCode).containsExactly("ROLE_PATIENT");

        verify(patientService).linkUserAccount("patient-1", "user-1");
        verify(emailVerificationService).issueAndSend(saved, "Trần Văn Thử");
        verifyNoInteractions(tokenProvider); // chưa cấp token khi chưa xác thực email
        assertThat(result.emailVerificationRequired()).isTrue();
        assertThat(result.email()).isEqualTo("thu.nghiem@example.com");
    }

    @Test
    void register_rejectsDuplicateUsername() {
        when(userRepository.existsByUsername("benhnhan_moi")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(validRequest()))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getErrorCode())
                .isEqualTo(ErrorCode.USERNAME_ALREADY_EXISTS);
        verify(userRepository, never()).save(any());
        verifyNoInteractions(patientService, emailVerificationService);
    }

    @Test
    void register_rejectsDuplicateEmail() {
        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(userRepository.existsByEmail("thu.nghiem@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(validRequest()))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getErrorCode())
                .isEqualTo(ErrorCode.EMAIL_ALREADY_EXISTS);
        verifyNoInteractions(patientService, emailVerificationService);
    }

    // ---------- Đăng nhập bằng mật khẩu ----------

    @Test
    void login_rejectsPatientWithUnverifiedEmail() {
        User user = patientUser(false);
        when(userRepository.findByUsername("benhnhan_moi")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Matkhau@123", "hashed")).thenReturn(true);

        assertThatThrownBy(() -> authService.login(new LoginRequest("benhnhan_moi", "Matkhau@123")))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getErrorCode())
                .isEqualTo(ErrorCode.EMAIL_NOT_VERIFIED);
        verifyNoInteractions(tokenProvider);
    }

    @Test
    void login_allowsStaffWithoutEmailVerification() {
        User staff = patientUser(false);
        staff.setStaff(true);
        when(userRepository.findByUsername("benhnhan_moi")).thenReturn(Optional.of(staff));
        when(passwordEncoder.matches("Matkhau@123", "hashed")).thenReturn(true);
        when(tokenProvider.generateAccessToken(any())).thenReturn("access");

        AuthResponse response = authService.login(new LoginRequest("benhnhan_moi", "Matkhau@123"));

        assertThat(response.getAccessToken()).isEqualTo("access");
    }

    @Test
    void login_rejectsPasswordForGoogleOnlyAccount() {
        User user = patientUser(true);
        user.setPasswordHash(null);
        when(userRepository.findByUsername("benhnhan_moi")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.login(new LoginRequest("benhnhan_moi", "bat_ky")))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getErrorCode())
                .isEqualTo(ErrorCode.PASSWORD_LOGIN_NOT_AVAILABLE);
        verify(passwordEncoder, never()).matches(any(), any());
    }

    @Test
    void login_locksAccountAfterFifthWrongPassword() {
        User user = patientUser(true);
        user.setFailedLoginAttempts(4);
        when(userRepository.findByUsername("benhnhan_moi")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("sai", "hashed")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(new LoginRequest("benhnhan_moi", "sai")))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getErrorCode())
                .isEqualTo(ErrorCode.ACCOUNT_LOCKED);
        assertThat(user.getStatus()).isEqualTo("LOCKED");
        assertThat(user.getLockedUntil()).isNotNull();
    }

    // ---------- Google ----------

    private static final GoogleTokenVerifier.GoogleUser GOOGLE_USER =
            new GoogleTokenVerifier.GoogleUser("google-sub-1", "thu.nghiem@example.com", true, "Trần Văn Thử");

    @Test
    void googleLogin_newEmail_requiresProfile() {
        when(googleTokenVerifier.verify("cred")).thenReturn(GOOGLE_USER);
        when(userRepository.findByGoogleSubject("google-sub-1")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("thu.nghiem@example.com")).thenReturn(Optional.empty());

        GoogleAuthResult result = authService.googleLogin("cred");

        assertThat(result.profileRequired()).isTrue();
        assertThat(result.email()).isEqualTo("thu.nghiem@example.com");
        assertThat(result.fullName()).isEqualTo("Trần Văn Thử");
        assertThat(result.auth()).isNull();
        verify(userRepository, never()).save(any());
    }

    @Test
    void googleLogin_rejectsUnverifiedGoogleEmail() {
        when(googleTokenVerifier.verify("cred")).thenReturn(
                new GoogleTokenVerifier.GoogleUser("google-sub-1", "thu.nghiem@example.com", false, "X"));

        assertThatThrownBy(() -> authService.googleLogin("cred"))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getErrorCode())
                .isEqualTo(ErrorCode.GOOGLE_EMAIL_NOT_VERIFIED);
    }

    @Test
    void googleLogin_rejectsStaffAccount() {
        User staff = patientUser(true);
        staff.setStaff(true);
        when(googleTokenVerifier.verify("cred")).thenReturn(GOOGLE_USER);
        when(userRepository.findByGoogleSubject("google-sub-1")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("thu.nghiem@example.com")).thenReturn(Optional.of(staff));

        assertThatThrownBy(() -> authService.googleLogin("cred"))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getErrorCode())
                .isEqualTo(ErrorCode.GOOGLE_STAFF_NOT_ALLOWED);
        assertThat(staff.getGoogleSubject()).isNull();
    }

    @Test
    void googleLogin_linksUnverifiedAccountAndRevokesItsPassword() {
        User squatted = patientUser(false);
        when(googleTokenVerifier.verify("cred")).thenReturn(GOOGLE_USER);
        when(userRepository.findByGoogleSubject("google-sub-1")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("thu.nghiem@example.com")).thenReturn(Optional.of(squatted));
        when(tokenProvider.generateAccessToken(any())).thenReturn("access");

        GoogleAuthResult result = authService.googleLogin("cred");

        assertThat(result.profileRequired()).isFalse();
        assertThat(result.auth().getAccessToken()).isEqualTo("access");
        assertThat(squatted.getGoogleSubject()).isEqualTo("google-sub-1");
        assertThat(squatted.getPasswordHash()).isNull();
        assertThat(squatted.isEmailVerified()).isTrue();
    }

    @Test
    void googleLogin_linkedVerifiedAccountKeepsPassword() {
        User user = patientUser(true);
        when(googleTokenVerifier.verify("cred")).thenReturn(GOOGLE_USER);
        when(userRepository.findByGoogleSubject("google-sub-1")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("thu.nghiem@example.com")).thenReturn(Optional.of(user));
        when(tokenProvider.generateAccessToken(any())).thenReturn("access");

        authService.googleLogin("cred");

        assertThat(user.getPasswordHash()).isEqualTo("hashed");
        assertThat(user.getGoogleSubject()).isEqualTo("google-sub-1");
    }

    @Test
    void googleRegister_createsVerifiedGoogleAccountWithoutPassword() {
        when(googleTokenVerifier.verify("cred")).thenReturn(GOOGLE_USER);
        when(userRepository.findByGoogleSubject("google-sub-1")).thenReturn(Optional.empty());
        when(userRepository.existsByEmail("thu.nghiem@example.com")).thenReturn(false);
        when(userRepository.existsByUsername("thu.nghiem")).thenReturn(false);
        stubPatientCreation();
        when(tokenProvider.generateAccessToken(any())).thenReturn("access");

        AuthResponse response = authService.googleRegister(new GoogleRegisterRequest(
                "cred", "Trần Văn Thử", LocalDate.of(1995, 5, 20), "MALE", "0912345678"));

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository, atLeastOnce()).save(captor.capture());
        User saved = captor.getAllValues().get(0);
        assertThat(saved.getUsername()).isEqualTo("thu.nghiem");
        assertThat(saved.getPasswordHash()).isNull();
        assertThat(saved.getAuthProvider()).isEqualTo("GOOGLE");
        assertThat(saved.getGoogleSubject()).isEqualTo("google-sub-1");
        assertThat(saved.isEmailVerified()).isTrue();
        verify(patientService).linkUserAccount(eq("patient-1"), eq("user-1"));
        verifyNoInteractions(emailVerificationService);
        assertThat(response.getAccessToken()).isEqualTo("access");
    }
}
