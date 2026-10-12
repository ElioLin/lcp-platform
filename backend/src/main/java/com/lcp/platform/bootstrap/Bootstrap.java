package com.lcp.platform.bootstrap;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import com.lcp.platform.identity.Caller;
import com.lcp.platform.metadata.*;
import com.lcp.platform.metadata.DefinitionInputs.*;
import com.lcp.platform.runtime.Records;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class Bootstrap implements ApplicationRunner {
    private final JdbcTemplate jdbc;
    private final PasswordEncoder passwords;
    private final Catalog catalog;
    private final Records records;
    private final String adminPassword, demoPassword;
    private final boolean seed;
    public Bootstrap(JdbcTemplate jdbc, PasswordEncoder passwords, Catalog catalog, Records records,
            @Value("${lcp.bootstrap.admin-password}") String adminPassword, @Value("${lcp.bootstrap.demo-password}") String demoPassword,
            @Value("${lcp.bootstrap.seed-example}") boolean seed) {
        this.jdbc=jdbc; this.passwords=passwords; this.catalog=catalog; this.records=records;
        this.adminPassword=adminPassword; this.demoPassword=demoPassword; this.seed=seed;
    }
    public void run(ApplicationArguments arguments) {
        if (jdbc.queryForObject("select count(*) from lcp.app_user", Integer.class) == 0 && adminPassword.length() < 12)
            throw new IllegalStateException("首次启动必须通过 LCP_BOOTSTRAP_ADMIN_PASSWORD 提供至少12位管理员密码");
        createUser("admin", "平台管理员", "ADMIN", adminPassword);
        if (!demoPassword.isEmpty()) createUser("demo", "演示业务用户", "USER", demoPassword);
        if (seed) seed();
    }
    private void createUser(String username, String label, String role, String password) {
        if (password.isEmpty()) return;
        if (password.length() < 12) throw new IllegalStateException("Bootstrap passwords must be at least 12 characters");
        jdbc.update("insert into lcp.app_user(id,username,display_name,password_hash,role) values(?,?,?,?,?) on conflict(username) do nothing",
            UUID.randomUUID(), username, label, passwords.encode(password), role);
    }
    private Caller caller(String username) {
        return jdbc.queryForObject("select id, username, display_name,role from lcp.app_user where username=?", (r, i) ->
            new Caller(r.getObject("id",UUID.class),r.getString("username"),r.getString("display_name"),r.getString("role")),username);
    }
    private void seed() {
        if (Boolean.TRUE.equals(jdbc.queryForObject("select exists(select 1 from lcp.object_definition where name='purchase_request')",Boolean.class))) return;
        var admin=caller("admin");
        catalog.create(new NewObject("purchase_request","采购申请","用于演示列表和单据详情的合成数据，不含真实业务信息"),admin);
        catalog.addField("purchase_request",field("document_no","申请单号",FieldType.TEXT,true),admin);
        catalog.addField("purchase_request",field("title","申请主题",FieldType.TEXT,true),admin);
        catalog.addField("purchase_request",new NewField("department","申请部门",FieldType.OPTION,true,null,null,List.of(new Choice("engineering","工程部"),new Choice("operations","运营部"),new Choice("finance","财务部"))),admin);
        catalog.addField("purchase_request",new NewField("amount","申请金额",FieldType.DECIMAL,true,18,2,List.of()),admin);
        catalog.addField("purchase_request",field("requested_date","期望到货日期",FieldType.DATE,false),admin);
        catalog.addField("purchase_request",new NewField("status","单据状态",FieldType.OPTION,true,null,null,List.of(new Choice("draft","草稿"),new Choice("submitted","已提交"))),admin);
        catalog.addField("purchase_request",field("description","申请说明",FieldType.LONG_TEXT,false),admin);
        catalog.publish("purchase_request",admin);
        var owner=demoPassword.isEmpty()?admin:caller("demo");
        records.create("purchase_request",Map.of("document_no","PR-DEMO-001","title","办公设备采购申请（示例）","department","operations","amount","12800.00","requested_date","2026-10-20","status","draft","description","本单据为平台功能演示数据。可用于查看动态列表、详情及字段配置。"),owner);
        records.create("purchase_request",Map.of("document_no","PR-DEMO-002","title","研发测试耗材（示例）","department","engineering","amount","3600.50","requested_date","2026-10-22","status","submitted","description","合成演示数据，不会触发真实审批或采购。"),owner);
        records.create("purchase_request",Map.of("document_no","PR-DEMO-003","title","财务办公用品（示例）","department","finance","amount","860.00","status","draft"),admin);
    }
    private NewField field(String name,String label,FieldType type,boolean required) { return new NewField(name,label,type,required,null,null,List.of()); }
}
