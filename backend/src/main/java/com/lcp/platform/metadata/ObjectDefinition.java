package com.lcp.platform.metadata;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record ObjectDefinition(UUID id, String name, String label, String description, String state,
        int version, boolean hasUnpublishedChanges, OffsetDateTime createdAt, OffsetDateTime publishedAt,
        List<FieldDefinition> fields) {
    public String table() { return "biz_" + id.toString().replace("-", ""); }
    public ObjectDefinition activeOnly() {
        return new ObjectDefinition(id, name, label, description, state, version, hasUnpublishedChanges,
            createdAt, publishedAt, fields.stream().filter(FieldDefinition::published).toList());
    }
}
