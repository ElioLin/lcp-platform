package com.lcp.platform.identity;

import java.util.UUID;
import com.lcp.platform.shared.ApiException;
import org.springframework.http.HttpStatus;

public record Caller(UUID id, String username, String displayName, String role) {
    public boolean isAdmin() { return "ADMIN".equals(role); }
    public void requireAdmin() { if (!isAdmin()) throw new ApiException(HttpStatus.FORBIDDEN, "只有平台管理员可以管理对象定义"); }
}
