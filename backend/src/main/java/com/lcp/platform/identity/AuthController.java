package com.lcp.platform.identity;

import java.util.Map;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AuthController {
    private final Users users;
    public AuthController(Users users) { this.users = users; }
    @GetMapping("/api/auth/csrf") Map<String, String> csrf(CsrfToken token) { return Map.of("token", token.getToken(), "headerName", token.getHeaderName()); }
    @GetMapping("/api/auth/me") Caller me(Authentication authentication) { return users.caller(authentication); }
    @GetMapping("/api/health") Map<String, String> health() { return Map.of("status", "UP", "application", "LCP", "stage", "PLAT-000-S1"); }
}
