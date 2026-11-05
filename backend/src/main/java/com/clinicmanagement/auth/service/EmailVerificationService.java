package com.clinicmanagement.auth.service;

import com.clinicmanagement.auth.entity.EmailVerificationToken;
import com.clinicmanagement.auth.event.EmailVerificationRequestedEvent;
import com.clinicmanagement.auth.repository.EmailVerificationTokenRepository;
import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.common.exception.ErrorCode;
import com.clinicmanagement.user.entity.User;
import com.clinicmanagement.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HexFormat;

@Service
public class EmailVerificationService {

    private static final Logger log = LoggerFactory.getLogger(EmailVerificationService.class);
    private static final SecureRandom RANDOM = new SecureRandom();

    private final EmailVerificationTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${app.email-verification.expiration-hours:24}")
    private long expirationHours;

    @Value("${app.email-verification.resend-cooldown-seconds:60}")
    private long resendCooldownSeconds;

    public EmailVerificationService(EmailVerificationTokenRepository tokenRepository, UserRepository userRepository,
                                    ApplicationEventPublisher eventPublisher) {
        this.tokenRepository = tokenRepository;
        this.userRepository = userRepository;
        this.eventPublisher = eventPublisher;
    }

    /** Tạo token mới (vô hiệu token cũ) và yêu cầu gửi email xác thực sau khi commit. */
    @Transactional
    public void issueAndSend(User user, String displayName) {
        Instant now = Instant.now();
        tokenRepository.invalidateActiveTokens(user.getId(), now);

        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        EmailVerificationToken token = new EmailVerificationToken();
        token.setUserId(user.getId());
        token.setTokenHash(sha256(rawToken));
        token.setExpiresAt(now.plus(expirationHours, ChronoUnit.HOURS));
        tokenRepository.save(token);

        String link = frontendUrl.replaceAll("/+$", "") + "/verify-email?token=" + rawToken;
        eventPublisher.publishEvent(new EmailVerificationRequestedEvent(
                user.getEmail(), displayName != null ? displayName : user.getUsername(), link, expirationHours));
    }

    /** Xác thực token; trả về người dùng đã được đánh dấu xác thực email. */
    @Transactional(noRollbackFor = BusinessException.class)
    public User verify(String rawToken) {
        if (rawToken == null || rawToken.isBlank() || rawToken.length() > 200) {
            throw new BusinessException(ErrorCode.VERIFICATION_TOKEN_INVALID);
        }
        EmailVerificationToken token = tokenRepository.findByTokenHash(sha256(rawToken.trim()))
                .orElseThrow(() -> new BusinessException(ErrorCode.VERIFICATION_TOKEN_INVALID));
        Instant now = Instant.now();

        User user = userRepository.findById(token.getUserId())
                .orElseThrow(() -> new BusinessException(ErrorCode.VERIFICATION_TOKEN_INVALID));

        if (token.isUsed()) {
            // Bấm lại link sau khi đã xác thực thành công -> không coi là lỗi
            if (user.isEmailVerified()) {
                return user;
            }
            throw new BusinessException(ErrorCode.VERIFICATION_TOKEN_INVALID);
        }
        if (token.isExpired(now)) {
            throw new BusinessException(ErrorCode.VERIFICATION_TOKEN_EXPIRED);
        }

        token.setUsedAt(now);
        tokenRepository.save(token);
        tokenRepository.invalidateActiveTokens(user.getId(), now);

        if (!user.isEmailVerified()) {
            user.setEmailVerifiedAt(now);
            userRepository.save(user);
        }
        log.info("Tài khoản [{}] đã xác thực email thành công", user.getUsername());
        return user;
    }

    /**
     * Gửi lại email xác thực. Luôn im lặng (không báo email có tồn tại hay không) để tránh dò tài khoản.
     */
    @Transactional
    public void resend(String email) {
        if (email == null || email.isBlank()) {
            return;
        }
        userRepository.findByEmail(email.trim().toLowerCase())
                .filter(u -> !u.isEmailVerified() && "LOCAL".equals(u.getAuthProvider()))
                .ifPresent(user -> {
                    boolean inCooldown = tokenRepository.findFirstByUserIdOrderByCreatedAtDesc(user.getId())
                            .map(t -> t.getCreatedAt().plusSeconds(resendCooldownSeconds).isAfter(Instant.now()))
                            .orElse(false);
                    if (inCooldown) {
                        log.debug("Bỏ qua gửi lại email xác thực cho [{}]: đang trong thời gian chờ", user.getUsername());
                        return;
                    }
                    issueAndSend(user, null);
                });
    }

    static String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 không khả dụng", e);
        }
    }
}
