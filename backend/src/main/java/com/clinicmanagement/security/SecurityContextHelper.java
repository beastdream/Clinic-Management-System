package com.clinicmanagement.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

public final class SecurityContextHelper {

    private SecurityContextHelper() {
    }

    public static Optional<UserPrincipal> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal principal) {
            return Optional.of(principal);
        }
        return Optional.empty();
    }

    public static Optional<String> getCurrentUserId() {
        return getCurrentUser().map(UserPrincipal::getId);
    }

    public static Optional<String> getCurrentUsername() {
        return getCurrentUser().map(UserPrincipal::getUsername);
    }

    public static boolean hasRole(String roleCode) {
        return getCurrentUser()
                .map(user -> Boolean.valueOf(user.getRoles().contains(roleCode)))
                .orElse(Boolean.FALSE);
    }

    public static boolean hasPermission(String permissionCode) {
        return getCurrentUser()
                .map(user -> Boolean.valueOf(user.getPermissions().contains(permissionCode)))
                .orElse(Boolean.FALSE);
    }
}
