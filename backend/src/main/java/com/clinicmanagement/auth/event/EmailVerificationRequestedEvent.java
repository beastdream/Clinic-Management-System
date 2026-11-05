package com.clinicmanagement.auth.event;

/**
 * Phát ra khi cần gửi email xác thực. Module notification gửi email sau khi transaction commit.
 */
public record EmailVerificationRequestedEvent(String email, String displayName, String verificationLink, long expirationHours) {

    @Override
    public String toString() {
        // Không in link (chứa token) khi log sự kiện
        return "EmailVerificationRequestedEvent[email=" + email + "]";
    }
}
