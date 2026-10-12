package com.lcp.platform.identity;

import java.io.Serializable;
import java.util.Collection;
import java.util.UUID;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

public record PlatformUser(UUID id, String username, String password, String role, boolean enabled) implements UserDetails, Serializable {
    private static final long serialVersionUID = 1L;
    public Collection<? extends GrantedAuthority> getAuthorities() { return java.util.List.of(new SimpleGrantedAuthority("ROLE_" + role)); }
    public String getUsername() { return username; }
    public String getPassword() { return password; }
    public boolean isEnabled() { return enabled; }
}
