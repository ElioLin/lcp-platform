package com.lcp.platform.identity;

import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import com.lcp.platform.shared.ApiException;

@Service
public class Users implements UserDetailsService {
    private final JdbcTemplate jdbc;
    public Users(JdbcTemplate jdbc) { this.jdbc = jdbc; }
    public PlatformUser loadUserByUsername(String username) {
        var found = jdbc.query("select * from lcp.app_user where username = ?", (r, i) ->
            new PlatformUser(r.getObject("id", UUID.class), r.getString("username"), r.getString("password_hash"), r.getString("role"), r.getBoolean("enabled")), username);
        if (found.isEmpty()) throw new UsernameNotFoundException("Invalid credentials");
        return found.getFirst();
    }
    public Caller caller(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof PlatformUser user))
            throw new ApiException(HttpStatus.UNAUTHORIZED, "请先登录");
        var found = jdbc.query("select id, username, display_name, role from lcp.app_user where id = ? and enabled = true", (r, i) ->
            new Caller(r.getObject("id", UUID.class), r.getString("username"), r.getString("display_name"), r.getString("role")), user.id());
        if (found.isEmpty()) throw new ApiException(HttpStatus.UNAUTHORIZED, "账号已停用，请重新登录");
        return found.getFirst();
    }
}
