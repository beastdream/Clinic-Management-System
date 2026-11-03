package com.clinicmanagement.auth.dto;

import java.util.Set;

public class AuthResponse {

    private String accessToken;
    private String refreshToken;
    private String tokenType = "Bearer";
    private long expiresInMs;
    private String userId;
    private String username;
    private String email;
    private boolean isStaff;
    private Set<String> roles;
    private Set<String> permissions;

    public AuthResponse() {
    }

    public AuthResponse(String accessToken, String refreshToken, String tokenType, long expiresInMs,
                        String userId, String username, String email, boolean isStaff,
                        Set<String> roles, Set<String> permissions) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.tokenType = tokenType != null ? tokenType : "Bearer";
        this.expiresInMs = expiresInMs;
        this.userId = userId;
        this.username = username;
        this.email = email;
        this.isStaff = isStaff;
        this.roles = roles;
        this.permissions = permissions;
    }

    public static AuthResponseBuilder builder() {
        return new AuthResponseBuilder();
    }

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    public long getExpiresInMs() {
        return expiresInMs;
    }

    public void setExpiresInMs(long expiresInMs) {
        this.expiresInMs = expiresInMs;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public boolean isStaff() {
        return isStaff;
    }

    public void setStaff(boolean staff) {
        isStaff = staff;
    }

    public Set<String> getRoles() {
        return roles;
    }

    public void setRoles(Set<String> roles) {
        this.roles = roles;
    }

    public Set<String> getPermissions() {
        return permissions;
    }

    public void setPermissions(Set<String> permissions) {
        this.permissions = permissions;
    }

    public static class AuthResponseBuilder {
        private String accessToken;
        private String refreshToken;
        private String tokenType = "Bearer";
        private long expiresInMs;
        private String userId;
        private String username;
        private String email;
        private boolean isStaff;
        private Set<String> roles;
        private Set<String> permissions;

        public AuthResponseBuilder accessToken(String accessToken) {
            this.accessToken = accessToken;
            return this;
        }

        public AuthResponseBuilder refreshToken(String refreshToken) {
            this.refreshToken = refreshToken;
            return this;
        }

        public AuthResponseBuilder tokenType(String tokenType) {
            this.tokenType = tokenType;
            return this;
        }

        public AuthResponseBuilder expiresInMs(long expiresInMs) {
            this.expiresInMs = expiresInMs;
            return this;
        }

        public AuthResponseBuilder userId(String userId) {
            this.userId = userId;
            return this;
        }

        public AuthResponseBuilder username(String username) {
            this.username = username;
            return this;
        }

        public AuthResponseBuilder email(String email) {
            this.email = email;
            return this;
        }

        public AuthResponseBuilder isStaff(boolean isStaff) {
            this.isStaff = isStaff;
            return this;
        }

        public AuthResponseBuilder roles(Set<String> roles) {
            this.roles = roles;
            return this;
        }

        public AuthResponseBuilder permissions(Set<String> permissions) {
            this.permissions = permissions;
            return this;
        }

        public AuthResponse build() {
            return new AuthResponse(accessToken, refreshToken, tokenType, expiresInMs, userId, username, email, isStaff, roles, permissions);
        }
    }
}
