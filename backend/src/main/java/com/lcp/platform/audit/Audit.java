package com.lcp.platform.audit;

import java.util.Map;
import java.util.UUID;
import com.lcp.platform.identity.Caller;
import com.lcp.platform.shared.Json;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class Audit {
    private final JdbcTemplate jdbc;
    private final Json json;
    public Audit(JdbcTemplate jdbc, Json json) { this.jdbc = jdbc; this.json = json; }
    public void append(Caller caller, UUID objectId, UUID recordId, String action, Map<String, ?> detail) {
        jdbc.update("insert into lcp.audit_event(id, object_id, record_id, actor_id, action, detail) values(?,?,?,?,?,?::jsonb)",
            UUID.randomUUID(), objectId, recordId, caller.id(), action, json.write(detail));
    }
}
