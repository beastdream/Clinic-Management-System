package com.clinicmanagement.security;

import com.clinicmanagement.user.entity.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

public class UserPrincipal implements UserDetails {

    private final String id;
    private final String username;
    private final String password;
    private final String email;
    private final boolean isStaff;
    private final boolean active;
    private final boolean nonLocked;
    private final Collection<? extends GrantedAuthority> authorities;
    private final Set<String> roles;
    private final Set<String> permissions;

    public UserPrincipal(String id, String username, String password, String email, boolean isStaff,
                         boolean active, boolean nonLocked, Collection<? extends GrantedAuthority> authorities,
                         Set<String> roles, Set<String> permissions) {
        this.id = id;
        this.username = username;
        this.password = password;
        this.email = email;
        this.isStaff = isStaff;
        this.active = active;
        this.nonLocked = nonLocked;
        this.authorities = authorities;
        this.roles = roles;
        this.permissions = permissions;
    }

    public static UserPrincipal create(User user) {
        Set<GrantedAuthority> authorities = new HashSet<>();
        Set<String> roles = new HashSet<>();
        Set<String> permissions = new HashSet<>();

        if (user.getRoles() != null) {
            user.getRoles().forEach(role -> {
                roles.add(role.getCode());
                authorities.add(new SimpleGrantedAuthority(role.getCode()));

                if (role.getPermissions() != null) {
                    role.getPermissions().forEach(perm -> {
                        permissions.add(perm.getCode());
                        authorities.add(new SimpleGrantedAuthority(perm.getCode()));
                    });
                }
            });
        }

        return new UserPrincipal(
                user.getId(),
                user.getUsername(),
                user.getPasswordHash(),
                user.getEmail(),
                user.isStaff(),
                user.isAccountActive(),
                user.isAccountNonLocked(),
                authorities,
                roles,
                permissions
        );
    }

    public String getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public boolean isStaff() {
        return isStaff;
    }

    public Set<String> getRoles() {
        return roles;
    }

    public Set<String> getPermissions() {
        return permissions;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return nonLocked;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return active;
    }
}
