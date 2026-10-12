package com.lcp.platform.metadata;

import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import com.lcp.platform.audit.Audit;
import com.lcp.platform.identity.Caller;
import com.lcp.platform.metadata.DefinitionInputs.*;
import com.lcp.platform.shared.ApiException;
import com.lcp.platform.shared.Json;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class Catalog {
    private static final Set<String> RESERVED = Set.of("id", "created_by", "created_at", "updated_at", "row_version");
    private final JdbcTemplate jdbc;
    private final Json json;
    private final Audit audit;
    public Catalog(JdbcTemplate jdbc, Json json, Audit audit) { this.jdbc = jdbc; this.json = json; this.audit = audit; }

    public List<ObjectDefinition> list(Caller caller) {
        var names = jdbc.queryForList("select name from lcp.object_definition " + (caller.isAdmin() ? "" : "where state='PUBLISHED' ") + "order by created_at, name", String.class);
        return names.stream().map(name -> get(name, caller.isAdmin())).toList();
    }
    public ObjectDefinition get(String name, boolean includeDraft) {
        var objects = jdbc.query("select * from lcp.object_definition where name=?", (r, i) -> {
            UUID id = r.getObject("id", UUID.class);
            List<FieldDefinition> fields = fields(id);
            return new ObjectDefinition(id, r.getString("name"), r.getString("label"), r.getString("description"),
                r.getString("state"), r.getInt("version"), "DRAFT".equals(r.getString("state")) || fields.stream().anyMatch(f -> !f.published()),
                r.getObject("created_at", OffsetDateTime.class), r.getObject("published_at", OffsetDateTime.class), fields);
        }, name);
        if (objects.isEmpty()) throw ApiException.notFound();
        var object = objects.getFirst();
        if (!includeDraft && !"PUBLISHED".equals(object.state())) throw ApiException.notFound();
        return includeDraft ? object : object.activeOnly();
    }
    private List<FieldDefinition> fields(UUID id) {
        return jdbc.query("select * from lcp.field_definition where object_id=? order by position, name", (r, i) ->
            new FieldDefinition(r.getObject("id", UUID.class), r.getString("name"), r.getString("label"), FieldType.valueOf(r.getString("type")),
                r.getBoolean("required"), r.getObject("precision_value", Integer.class), r.getObject("scale_value", Integer.class),
                json.choices(r.getString("options")), r.getInt("position"), r.getBoolean("published")), id);
    }
    private void lock(String name) {
        if (jdbc.queryForList("select id from lcp.object_definition where name=? for update", name).isEmpty()) throw ApiException.notFound();
    }
    private static void validName(String name) {
        if (name == null || !name.matches("[a-z][a-z0-9_]{1,49}") || RESERVED.contains(name))
            throw ApiException.badRequest("API 名称需以小写字母开头，包含 2–50 个小写字母、数字或下划线，且不能使用系统保留名称");
    }
    @Transactional
    public ObjectDefinition create(NewObject input, Caller caller) {
        caller.requireAdmin(); validName(input.name());
        if (Boolean.TRUE.equals(jdbc.queryForObject("select exists(select 1 from lcp.object_definition where name=?)", Boolean.class, input.name())))
            throw ApiException.conflict("对象 API 名称已存在");
        UUID id = UUID.randomUUID();
        jdbc.update("insert into lcp.object_definition(id,name,label,description) values(?,?,?,?)", id, input.name(), input.label().strip(), input.description() == null ? "" : input.description().strip());
        audit.append(caller, id, null, "OBJECT_CREATED", Map.of("name", input.name()));
        return get(input.name(), true);
    }
    @Transactional
    public ObjectDefinition updateLabels(String name, ObjectLabels input, Caller caller) {
        caller.requireAdmin(); lock(name);
        var object = get(name, true);
        jdbc.update("update lcp.object_definition set label=?, description=? where id=?", input.label().strip(), input.description() == null ? "" : input.description().strip(), object.id());
        audit.append(caller, object.id(), null, "OBJECT_LABEL_UPDATED", Map.of("label", input.label()));
        return get(name, true);
    }
    private List<Choice> validate(NewField input) {
        validName(input.name());
        if (input.type() == null) throw ApiException.badRequest("请选择字段类型");
        if (input.type() == FieldType.DECIMAL) {
            if (input.precision() == null || input.scale() == null || input.precision() < 1 || input.precision() > 38 || input.scale() < 0 || input.scale() > input.precision())
                throw ApiException.badRequest("小数字段需配置精度 1–38，小数位不能超过精度");
        } else if (input.precision() != null || input.scale() != null) throw ApiException.badRequest("只有小数字段可以设置精度");
        var options = input.options() == null ? List.<Choice>of() : input.options();
        if (input.type() == FieldType.OPTION) {
            if (options.isEmpty() || options.size() > 100) throw ApiException.badRequest("选项字段需提供 1–100 个选项");
            var seen = new HashSet<String>();
            for (var option : options) {
                if (option == null || option.value() == null || !option.value().matches("[a-zA-Z0-9_\\-]{1,80}") || option.label() == null || option.label().isBlank() || option.label().length() > 100 || !seen.add(option.value()))
                    throw ApiException.badRequest("选项机器值须唯一且有效，每个选项都需显示标签");
            }
        } else if (!options.isEmpty()) throw ApiException.badRequest("只有选项字段可以设置选项");
        return options;
    }
    @Transactional
    public ObjectDefinition addField(String name, NewField input, Caller caller) {
        caller.requireAdmin(); var options = validate(input); lock(name);
        var object = get(name, true);
        if (object.fields().size() >= 100) throw ApiException.badRequest("本阶段每个对象最多 100 个字段");
        if (object.fields().stream().anyMatch(f -> f.name().equals(input.name()))) throw ApiException.conflict("字段 API 名称已存在");
        int position = object.fields().stream().mapToInt(FieldDefinition::position).max().orElse(-1) + 1;
        jdbc.update("insert into lcp.field_definition(id,object_id,name,label,type,required,precision_value,scale_value,options,position) values(?,?,?,?,?,?,?,?,?::jsonb,?)",
            UUID.randomUUID(), object.id(), input.name(), input.label().strip(), input.type().name(), input.required(), input.precision(), input.scale(), json.write(options), position);
        audit.append(caller, object.id(), null, "FIELD_DRAFT_ADDED", Map.of("name", input.name()));
        return get(name, true);
    }
    @Transactional
    public ObjectDefinition updateField(String name, UUID fieldId, NewField input, Caller caller) {
        caller.requireAdmin(); var options = validate(input); lock(name);
        var object = get(name, true);
        var field = object.fields().stream().filter(f -> f.id().equals(fieldId)).findFirst().orElseThrow(ApiException::notFound);
        if (field.published() && (!field.name().equals(input.name()) || field.type() != input.type() || field.required() != input.required()
                || !java.util.Objects.equals(field.precision(), input.precision()) || !java.util.Objects.equals(field.scale(), input.scale()) || !field.options().equals(options)))
            throw ApiException.conflict("已发布字段本阶段仅支持修改显示名称；结构变更需后续迁移方案");
        jdbc.update("update lcp.field_definition set name=?,label=?,type=?,required=?,precision_value=?,scale_value=?,options=?::jsonb where id=? and object_id=?",
            input.name(), input.label().strip(), input.type().name(), input.required(), input.precision(), input.scale(), json.write(options), fieldId, object.id());
        audit.append(caller, object.id(), null, "FIELD_UPDATED", Map.of("name", input.name()));
        return get(name, true);
    }
    @Transactional
    public ObjectDefinition deleteDraftField(String name, UUID fieldId, Caller caller) {
        caller.requireAdmin(); lock(name); var object = get(name, true);
        var field = object.fields().stream().filter(f -> f.id().equals(fieldId)).findFirst().orElseThrow(ApiException::notFound);
        if (field.published()) throw ApiException.conflict("已发布字段不能直接删除");
        jdbc.update("delete from lcp.field_definition where id=? and object_id=?", fieldId, object.id());
        audit.append(caller, object.id(), null, "FIELD_DRAFT_REMOVED", Map.of("name", field.name()));
        return get(name, true);
    }
    @Transactional
    public ObjectDefinition publish(String name, Caller caller) {
        caller.requireAdmin(); lock(name); var object = get(name, true);
        if (object.fields().isEmpty()) throw ApiException.badRequest("请先配置至少一个字段");
        if (!object.hasUnpublishedChanges()) return object;
        String table = "lcp_business.\"" + object.table() + "\"";
        if ("DRAFT".equals(object.state())) {
            var ddl = new StringBuilder("create table ").append(table)
                .append(" (id uuid primary key, created_by uuid not null references lcp.app_user(id), created_at timestamptz not null default current_timestamp, updated_at timestamptz not null default current_timestamp, row_version integer not null default 1");
            for (var field : object.fields()) ddl.append(", \"").append(field.column()).append("\" ").append(field.sqlType()).append(field.required() ? " not null" : "");
            jdbc.execute(ddl.append(")").toString());
            jdbc.execute("create index on " + table + " (created_by, created_at desc)");
        } else {
            for (var field : object.fields()) if (!field.published())
                jdbc.execute("alter table " + table + " add column \"" + field.column() + "\" " + field.sqlType() + (field.required() ? " not null" : ""));
        }
        // Transactional PostgreSQL DDL and activation share the same Spring transaction.
        // Exceptions propagate. No active metadata is written after a failed structural change.
        jdbc.update("update lcp.field_definition set published=true where object_id=?", object.id());
        jdbc.update("update lcp.object_definition set state='PUBLISHED', version=version+1, published_at=current_timestamp where id=?", object.id());
        audit.append(caller, object.id(), null, "OBJECT_PUBLISHED", Map.of("version", object.version() + 1));
        return get(name, true);
    }
}
