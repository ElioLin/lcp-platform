package com.lcp.platform.metadata;

import java.util.List;
import java.util.UUID;

public record FieldDefinition(UUID id, String name, String label, FieldType type, boolean required,
        Integer precision, Integer scale, List<Choice> options, int position, boolean published) {
    public String column() { return "f_" + id.toString().replace("-", ""); }
    public String sqlType() {
        return switch (type) {
            case TEXT, OPTION -> "varchar(255)";
            case LONG_TEXT -> "text";
            case DECIMAL -> "numeric(" + precision + "," + scale + ")";
            case INTEGER -> "integer";
            case DATE -> "date";
            case BOOLEAN -> "boolean";
        };
    }
}
