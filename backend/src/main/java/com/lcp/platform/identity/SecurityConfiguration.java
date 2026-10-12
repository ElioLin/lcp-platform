package com.lcp.platform.identity;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.session.jdbc.config.annotation.web.http.EnableJdbcHttpSession;
import org.springframework.session.jdbc.JdbcIndexedSessionRepository;
import org.springframework.session.config.SessionRepositoryCustomizer;
import org.springframework.boot.sql.init.dependency.DependsOnDatabaseInitialization;

@Configuration
@EnableJdbcHttpSession(tableName = "lcp.spring_session")
public class SecurityConfiguration {
    @Bean PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(12); }
    @Bean
    @DependsOnDatabaseInitialization
    SessionRepositoryCustomizer<JdbcIndexedSessionRepository> sessionRepositoryConfiguration() {
        return repository -> repository.setDefaultMaxInactiveInterval(java.time.Duration.ofMinutes(30));
    }
    @Bean SecurityFilterChain security(HttpSecurity http) throws Exception {
        return http
            .authorizeHttpRequests(a -> a
                .requestMatchers("/api/auth/csrf", "/api/auth/login", "/api/health").permitAll()
                .requestMatchers("/api/**").authenticated()
                .anyRequest().denyAll())
            .formLogin(f -> f.loginProcessingUrl("/api/auth/login")
                .successHandler((request, response, auth) -> { response.setStatus(200); response.setContentType("application/json"); response.getWriter().write("{\"authenticated\":true}"); })
                .failureHandler((request, response, e) -> { response.setStatus(401); response.setContentType("application/json;charset=UTF-8"); response.getWriter().write("{\"message\":\"账号或密码不正确\"}"); }))
            .logout(l -> l.logoutUrl("/api/auth/logout").invalidateHttpSession(true).deleteCookies("SESSION")
                .logoutSuccessHandler((request, response, auth) -> response.setStatus(204)))
            .exceptionHandling(e -> e
                .authenticationEntryPoint((request, response, ex) -> { response.setStatus(401); response.setContentType("application/json;charset=UTF-8"); response.getWriter().write("{\"message\":\"请先登录\"}"); })
                .accessDeniedHandler((request, response, ex) -> { response.setStatus(403); response.setContentType("application/json;charset=UTF-8"); response.getWriter().write("{\"message\":\"操作未授权或会话校验已失效，请刷新后重试\"}"); }))
            .build();
    }
}
