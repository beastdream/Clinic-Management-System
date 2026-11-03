package com.clinicmanagement.auth.service;

import com.clinicmanagement.auth.dto.AuthResponse;
import com.clinicmanagement.auth.dto.LoginRequest;
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

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final CustomUserDetailsService userDetailsService;

    @Value("${app.jwt.expiration-ms:900000}")
    private long jwtExpirationMs;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       JwtTokenProvider tokenProvider, CustomUserDetailsService userDetailsService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.userDetailsService = userDetailsService;
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .or(() -> userRepository.findByEmail(request.getUsername()))
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_CREDENTIALS));

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

        // Kiểm tra mật khẩu
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            int attempts = user.getFailedLoginAttempts() + 1;
            user.setFailedLoginAttempts(attempts);

            if (attempts >= 5) {
                user.setStatus("LOCKED");
                user.setLockedUntil(Instant.now().plus(15, ChronoUnit.MINUTES));
                userRepository.save(user);
                log.warn("Tài khoản [{}] bị khóa 15 phút do nhập sai mật khẩu 5 lần", user.getUsername());
                throw new BusinessException(ErrorCode.ACCOUNT_LOCKED);
            }

            userRepository.save(user);
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }

        // Đăng nhập thành công -> Reset số lần đăng nhập sai
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        userRepository.save(user);

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
