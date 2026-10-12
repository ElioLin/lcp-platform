package com.lcp.platform.runtime;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.*;
import com.lcp.platform.audit.Audit;
import com.lcp.platform.identity.Caller;
import com.lcp.platform.metadata.*;
import com.lcp.platform.shared.ApiException;
import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.Field;
import org.jooq.Table;
import org.jooq.impl.DSL;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class Records {
    public record DataRecord(UUID id, UUID createdBy, String createdByName, OffsetDateTime createdAt,
            OffsetDateTime updatedAt, int version, Map<String, Object> values) {}
    public record Page(List<DataRecord> items, long total, int page, int size) {}
    public record Write(Map<String, Object> values, Integer version) {}
    private final DSLContext sql;
    private final Catalog catalog;
    private final Audit audit;
    private final JdbcTemplate jdbc;
    public Records(DSLContext sql, Catalog catalog, Audit audit, JdbcTemplate jdbc) { this.sql = sql; this.catalog = catalog; this.audit = audit; this.jdbc = jdbc; }
    private Table<?> table(ObjectDefinition object) { return DSL.table(DSL.name("lcp_business", object.table())); }
    private Field<UUID> id() { return DSL.field(DSL.name("id"), UUID.class); }
    private Condition visible(Caller caller) { return caller.isAdmin() ? DSL.trueCondition() : DSL.field(DSL.name("created_by"), UUID.class).eq(caller.id()); }
    private ObjectDefinition active(String name) { return catalog.get(name, false); }

    public Page list(String name, Caller caller, int page, int size, String search, String sort, boolean ascending) {
        if (page < 1 || page > 100000 || size < 1 || size > 100) throw ApiException.badRequest("分页大小应为 1–100，页码必须有效");
        if (search != null && search.length() > 200) throw ApiException.badRequest("搜索词最多 200 字符");
        var object = active(name);
        Condition condition = visible(caller);
        if (search != null && !search.isBlank()) {
            Condition text = DSL.falseCondition();
            for (var field : object.fields()) if (field.type() == FieldType.TEXT || field.type() == FieldType.LONG_TEXT || field.type() == FieldType.OPTION)
                text = text.or(DSL.field(DSL.name(field.column()), String.class).containsIgnoreCase(search.strip()));
            condition = condition.and(text);
        }
        Field<?> sortField;
        if (sort == null || sort.equals("created_at")) sortField = DSL.field(DSL.name("created_at"), OffsetDateTime.class);
        else {
            var field = object.fields().stream().filter(f -> f.name().equals(sort)).findFirst().orElseThrow(() -> ApiException.badRequest("排序字段不存在"));
            sortField = DSL.field(DSL.name(field.column()));
        }
        long total = sql.selectCount().from(table(object)).where(condition).fetchOne(0, Long.class);
        var rows = sql.selectFrom(table(object)).where(condition).orderBy(ascending ? sortField.asc().nullsLast() : sortField.desc().nullsLast(), id().asc())
            .limit(size).offset((page - 1) * size).fetch();
        var owners = ownerNames(rows.stream().map(r -> r.get("created_by", UUID.class)).toList());
        return new Page(rows.stream().map(r -> view(object, r, owners)).toList(), total, page, size);
    }
    public DataRecord get(String name, UUID recordId, Caller caller) {
        var object = active(name);
        var record = sql.selectFrom(table(object)).where(id().eq(recordId).and(visible(caller))).fetchOne();
        if (record == null) throw ApiException.notFound();
        return view(object, record, ownerNames(List.of(record.get("created_by", UUID.class))));
    }
    private Map<UUID, String> ownerNames(List<UUID> ids) {
        if (ids.isEmpty()) return Map.of();
        Field<UUID> userId = DSL.field(DSL.name("id"), UUID.class);
        Field<String> displayName = DSL.field(DSL.name("display_name"), String.class);
        return sql.select(userId, displayName).from(DSL.name("lcp", "app_user")).where(userId.in(ids)).fetchMap(userId, displayName);
    }
    private DataRecord view(ObjectDefinition object, org.jooq.Record record, Map<UUID, String> owners) {
        var values = new LinkedHashMap<String, Object>();
        for (var field : object.fields()) {
            Object value = record.get(field.column());
            if (value instanceof BigDecimal decimal) value = decimal.toPlainString();
            if (value instanceof LocalDate date) value = date.toString();
            if (value instanceof java.sql.Date date) value = date.toLocalDate().toString();
            values.put(field.name(), value);
        }
        UUID owner = record.get("created_by", UUID.class);
        return new DataRecord(record.get("id", UUID.class), owner, owners.get(owner), record.get("created_at", OffsetDateTime.class),
            record.get("updated_at", OffsetDateTime.class), record.get("row_version", Integer.class), values);
    }
    private Map<Field<?>, Object> validate(ObjectDefinition object, Map<String, Object> input) {
        if (input == null) throw ApiException.badRequest("请提供 values 字段");
        var allowed = object.fields().stream().map(FieldDefinition::name).collect(java.util.stream.Collectors.toSet());
        if (!allowed.containsAll(input.keySet())) throw ApiException.badRequest("存在未定义或系统保留字段，不能自报创建人或版本");
        var values = new LinkedHashMap<Field<?>, Object>();
        for (var field : object.fields()) {
            Object raw = input.get(field.name());
            if (raw instanceof String text && text.isBlank()) raw = null;
            if (raw == null) {
                if (field.required()) throw ApiException.badRequest(field.label() + "为必填项");
                values.put(DSL.field(DSL.name(field.column())), null); continue;
            }
            Object value;
            try {
                value = switch (field.type()) {
                    case TEXT, LONG_TEXT -> {
                        if (!(raw instanceof String text) || text.length() > (field.type() == FieldType.TEXT ? 255 : 20000)) throw new IllegalArgumentException();
                        yield text;
                    }
                    case OPTION -> {
                        if (!(raw instanceof String text) || field.options().stream().noneMatch(o -> o.value().equals(text))) throw new IllegalArgumentException();
                        yield text;
                    }
                    case DECIMAL -> {
                        // Strings preserve digits across JSON and browsers. Numeric JSON input is intentionally rejected.
                        if (!(raw instanceof String text) || text.length() > 80 || !text.matches("[-+]?[0-9]+(?:\\.[0-9]+)?")) throw new IllegalArgumentException();
                        var decimal = new BigDecimal(text).setScale(field.scale(), RoundingMode.UNNECESSARY);
                        if (decimal.precision() > field.precision()) throw new IllegalArgumentException();
                        yield decimal;
                    }
                    case INTEGER -> {
                        if (!(raw instanceof Number)) throw new IllegalArgumentException();
                        yield new BigDecimal(raw.toString()).intValueExact();
                    }
                    case DATE -> { if (!(raw instanceof String text)) throw new IllegalArgumentException(); yield LocalDate.parse(text); }
                    case BOOLEAN -> { if (!(raw instanceof Boolean bool)) throw new IllegalArgumentException(); yield bool; }
                };
            } catch (RuntimeException e) { throw ApiException.badRequest(field.label() + "的格式、长度、精度或选项值不符合字段定义"); }
            values.put(DSL.field(DSL.name(field.column())), value);
        }
        return values;
    }
    @Transactional
    public DataRecord create(String name, Map<String, Object> input, Caller caller) {
        var object = active(name); var values = validate(object, input); UUID recordId = UUID.randomUUID();
        values.put(id(), recordId); values.put(DSL.field(DSL.name("created_by"), UUID.class), caller.id());
        sql.insertInto(table(object)).set(values).execute();
        audit.append(caller, object.id(), recordId, "RECORD_CREATED", Map.of("fields", input.keySet()));
        return get(name, recordId, caller);
    }
    @Transactional
    public DataRecord update(String name, UUID recordId, Write input, Caller caller) {
        if (input.version() == null || input.version() < 1) throw ApiException.badRequest("编辑需提供有效的记录 version");
        var object = active(name); var values = validate(object, input.values());
        var version = DSL.field(DSL.name("row_version"), Integer.class);
        int changed = sql.update(table(object)).set(values).set(version, version.add(1))
            .set(DSL.field(DSL.name("updated_at"), OffsetDateTime.class), OffsetDateTime.now(java.time.ZoneOffset.UTC))
            .where(id().eq(recordId).and(visible(caller)).and(version.eq(input.version()))).execute();
        if (changed == 0) { get(name, recordId, caller); throw ApiException.conflict("记录已被其他操作更新，请刷新后重新编辑"); }
        audit.append(caller, object.id(), recordId, "RECORD_UPDATED", Map.of("fields", input.values().keySet(), "version", input.version() + 1));
        return get(name, recordId, caller);
    }
    public List<Map<String, Object>> history(String name, UUID recordId, Caller caller) {
        get(name, recordId, caller); var object = active(name);
        return jdbc.query("select a.action,a.created_at,u.display_name from lcp.audit_event a join lcp.app_user u on u.id=a.actor_id where a.object_id=? and a.record_id=? order by a.created_at desc limit 50",
            (r, i) -> Map.<String, Object>of("action", r.getString("action"), "createdAt", r.getObject("created_at", OffsetDateTime.class), "actor", r.getString("display_name")), object.id(), recordId);
    }
}
