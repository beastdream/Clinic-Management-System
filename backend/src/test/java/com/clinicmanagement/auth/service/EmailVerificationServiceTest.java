package com.clinicmanagement.auth.service;

import com.clinicmanagement.auth.entity.EmailVerificationToken;
import com.clinicmanagement.auth.event.EmailVerificationRequestedEvent;
import com.clinicmanagement.auth.repository.EmailVerificationTokenRepository;
import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.common.exception.ErrorCode;
import com.clinicmanagement.user.entity.User;
import com.clinicmanagement.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailVerificationServiceTest {

    @Mock EmailVerificationTokenRepository tokenRepository;
    @Mock UserRepository userRepository;
    @Mock ApplicationEventPublisher eventPublisher;

    EmailVerificationService service;

    @BeforeEach
    void setUp() {
        service = new EmailVerificationService(tokenRepository, userRepository, eventPublisher);
        ReflectionTestUtils.setField(service, "frontendUrl", "http://localhost:5173/");
        ReflectionTestUtils.setField(service, "expirationHours", 24L);
        ReflectionTestUtils.setField(service, "resendCooldownSeconds", 60L);
    }

    private User unverifiedUser() {
        User user = new User();
        user.setId("user-1");
        user.setUsername("benhnhan_moi");
        user.setEmail("thu.nghiem@example.com");
        return user;
    }

    private EmailVerificationToken token(Instant expiresAt, Instant usedAt) {
        EmailVerificationToken t = new EmailVerificationToken();
        t.setUserId("user-1");
        t.setExpiresAt(expiresAt);
        t.setUsedAt(usedAt);
        return t;
    }

    @Test
    void issueAndSend_storesOnlyHashAndPublishesLinkWithRawToken() {
        service.issueAndSend(unverifiedUser(), "Trần Văn Thử");

        ArgumentCaptor<EmailVerificationToken> tokenCaptor = ArgumentCaptor.forClass(EmailVerificationToken.class);
        verify(tokenRepository).save(tokenCaptor.capture());
        ArgumentCaptor<EmailVerificationRequestedEvent> eventCaptor = ArgumentCaptor.forClass(EmailVerificationRequestedEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());

        String link = eventCaptor.getValue().verificationLink();
        assertThat(link).startsWith("http://localhost:5173/verify-email?token=");
        String rawToken = link.substring(link.indexOf("token=") + 6);
        assertThat(tokenCaptor.getValue().getTokenHash())
                .isEqualTo(EmailVerificationService.sha256(rawToken))
                .isNotEqualTo(rawToken);
        verify(tokenRepository).invalidateActiveTokens(eq("user-1"), any());
    }

    @Test
    void verify_marksUserVerifiedAndConsumesToken() {
        User user = unverifiedUser();
        EmailVerificationToken t = token(Instant.now().plusSeconds(3600), null);
        when(tokenRepository.findByTokenHash(EmailVerificationService.sha256("abc"))).thenReturn(Optional.of(t));
        when(userRepository.findById("user-1")).thenReturn(Optional.of(user));

        service.verify("abc");

        assertThat(user.isEmailVerified()).isTrue();
        assertThat(t.isUsed()).isTrue();
    }

    @Test
    void verify_rejectsExpiredToken() {
        User user = unverifiedUser();
        when(tokenRepository.findByTokenHash(any())).thenReturn(Optional.of(token(Instant.now().minusSeconds(1), null)));
        when(userRepository.findById("user-1")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> service.verify("abc"))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getErrorCode())
                .isEqualTo(ErrorCode.VERIFICATION_TOKEN_EXPIRED);
        assertThat(user.isEmailVerified()).isFalse();
    }

    @Test
    void verify_rejectsUnknownToken() {
        when(tokenRepository.findByTokenHash(any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.verify("khong-ton-tai"))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getErrorCode())
                .isEqualTo(ErrorCode.VERIFICATION_TOKEN_INVALID);
    }

    @Test
    void verify_usedTokenOfUnverifiedUserIsInvalid() {
        when(tokenRepository.findByTokenHash(any())).thenReturn(Optional.of(token(Instant.now().plusSeconds(3600), Instant.now())));
        when(userRepository.findById("user-1")).thenReturn(Optional.of(unverifiedUser()));

        assertThatThrownBy(() -> service.verify("abc"))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getErrorCode())
                .isEqualTo(ErrorCode.VERIFICATION_TOKEN_INVALID);
    }

    @Test
    void resend_isSilentForUnknownEmail() {
        when(userRepository.findByEmail("khong@example.com")).thenReturn(Optional.empty());

        service.resend("khong@example.com");

        verifyNoInteractions(eventPublisher);
        verify(tokenRepository, never()).save(any());
    }

    @Test
    void resend_respectsCooldown() {
        User user = unverifiedUser();
        when(userRepository.findByEmail("thu.nghiem@example.com")).thenReturn(Optional.of(user));
        EmailVerificationToken recent = token(Instant.now().plusSeconds(3600), null);
        recent.setCreatedAt(Instant.now().minusSeconds(10));
        when(tokenRepository.findFirstByUserIdOrderByCreatedAtDesc("user-1")).thenReturn(Optional.of(recent));

        service.resend("Thu.Nghiem@example.com");

        verifyNoInteractions(eventPublisher);
    }
}
