package com.lcp.platform;

import java.net.CookieManager;
import java.net.CookiePolicy;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.JdbcTemplate;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT, properties={
    "spring.datasource.url=${LCP_TEST_DB_URL:jdbc:postgresql://127.0.0.1:55433/lcp_s1_test}",
    "lcp.bootstrap.admin-password=integration-admin-only-123",
    "lcp.bootstrap.demo-password=integration-demo-only-123",
    "lcp.bootstrap.seed-example=false"
})
class PlatformIntegrationTest {
    @LocalServerPort int port;
    @Autowired ObjectMapper mapper;
    @Autowired JdbcTemplate jdbc;

    class Client {
        final HttpClient http=HttpClient.newBuilder().cookieHandler(new CookieManager(null,CookiePolicy.ACCEPT_ALL)).connectTimeout(Duration.ofSeconds(5)).build();
        HttpResponse<String> send(String method,String path,String body,boolean csrf) throws Exception {
            var builder=HttpRequest.newBuilder(URI.create("http://127.0.0.1:"+port+path)).timeout(Duration.ofSeconds(15));
            if(csrf) {var token=json(send("GET","/api/auth/csrf",null,false));builder.header(token.get("headerName").asText(),token.get("token").asText());}
            if(body!=null)builder.header("Content-Type","application/json");
            return http.send(builder.method(method,body==null?HttpRequest.BodyPublishers.noBody():HttpRequest.BodyPublishers.ofString(body)).build(),HttpResponse.BodyHandlers.ofString());
        }
        JsonNode get(String path) throws Exception {var response=send("GET",path,null,false);assertThat(response.statusCode()).as(response.body()).isEqualTo(200);return json(response);}
        JsonNode write(String method,String path,Object input) throws Exception {var response=send(method,path,mapper.writeValueAsString(input),true);assertThat(response.statusCode()).as(response.body()).isEqualTo(200);return json(response);}
        void login(String username,String password,int expected) throws Exception {
            var csrf=get("/api/auth/csrf");
            var request=HttpRequest.newBuilder(URI.create("http://127.0.0.1:"+port+"/api/auth/login"))
                .header(csrf.get("headerName").asText(),csrf.get("token").asText()).header("Content-Type","application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString("username="+encode(username)+"&password="+encode(password))).build();
            assertThat(http.send(request,HttpResponse.BodyHandlers.ofString()).statusCode()).isEqualTo(expected);
        }
    }
    private JsonNode json(HttpResponse<String> response){return mapper.readTree(response.body());}
    private String encode(String text){return URLEncoder.encode(text,StandardCharsets.UTF_8);}
    private Client admin() throws Exception {var c=new Client();c.login("admin","integration-admin-only-123",200);return c;}
    private Client demo() throws Exception {var c=new Client();c.login("demo","integration-demo-only-123",200);return c;}
    private String object(Client admin) throws Exception {
        String name="test_"+UUID.randomUUID().toString().replace("-","");
        admin.write("POST","/api/metadata/objects",Map.of("name",name,"label","集成测试对象","description","synthetic integration data"));
        add(admin,name,"title","TEXT",true);
        admin.write("POST","/api/metadata/objects/"+name+"/fields",Map.of("name","amount","label","金额","type","DECIMAL","required",true,"precision",20,"scale",2));
        return name;
    }
    private JsonNode add(Client admin,String name,String field,String type,boolean required) throws Exception {
        return admin.write("POST","/api/metadata/objects/"+name+"/fields",Map.of("name",field,"label",field,"type",type,"required",required));
    }
    private JsonNode publish(Client admin,String name) throws Exception {return admin.write("POST","/api/metadata/objects/"+name+"/publish",Map.of());}
    private JsonNode record(Client client,String name) throws Exception {return client.write("POST","/api/data/"+name,Map.of("values",Map.of("title","合成单据","amount","9007199254740993.21")));}

    @Test void authenticationCsrfAndLogoutUseRealSessions() throws Exception {
        var c=new Client();assertThat(c.send("GET","/api/metadata/objects",null,false).statusCode()).isEqualTo(401);
        c.login("admin","wrong-password",401);c.login("admin","integration-admin-only-123",200);
        assertThat(c.get("/api/auth/me").get("role").asText()).isEqualTo("ADMIN");
        assertThat(c.send("POST","/api/metadata/objects","{}",false).statusCode()).isEqualTo(403);
        assertThat(jdbc.queryForObject("select count(*) from lcp.spring_session where principal_name='admin'",Long.class)).isPositive();
        assertThat(c.send("POST","/api/auth/logout",null,true).statusCode()).isEqualTo(204);
        assertThat(c.send("GET","/api/auth/me",null,false).statusCode()).isEqualTo(401);
    }
    @Test void userCannotManageObjectsOrReadDraftDefinitions() throws Exception {
        var a=admin();var u=demo();String name=object(a);
        assertThat(u.send("POST","/api/metadata/objects",mapper.writeValueAsString(Map.of("name","forbidden","label","forbidden")),true).statusCode()).isEqualTo(403);
        assertThat(u.send("GET","/api/metadata/objects/"+name,null,false).statusCode()).isEqualTo(404);
        assertThat(u.send("POST","/api/metadata/objects/"+name+"/publish","{}",true).statusCode()).isEqualTo(403);
    }
    @Test void runtimeTypedStoragePreservesDecimalAndRejectsForgedFields() throws Exception {
        var a=admin();String name=object(a);add(a,name,"business_date","DATE",false);var definition=publish(a,name);var u=demo();
        var row=u.write("POST","/api/data/"+name,Map.of("values",Map.of("title","合成单据","amount","9007199254740993.21","business_date","2026-10-20")));
        assertThat(row.get("values").get("amount").asText()).isEqualTo("9007199254740993.21");
        assertThat(row.get("values").get("business_date").asText()).isEqualTo("2026-10-20");
        String table="biz_"+definition.get("id").asText().replace("-","");
        String column="f_"+definition.get("fields").get(1).get("id").asText().replace("-","");
        assertThat(jdbc.queryForObject("select data_type from information_schema.columns where table_schema='lcp_business' and table_name=? and column_name=?",String.class,table,column)).isEqualTo("numeric");
        assertThat(jdbc.queryForObject("select numeric_precision from information_schema.columns where table_schema='lcp_business' and table_name=? and column_name=?",Integer.class,table,column)).isEqualTo(20);
        assertThat(u.send("POST","/api/data/"+name,"{\"values\":{\"title\":\"bad\",\"amount\":1.23}}",true).statusCode()).isEqualTo(400);
        assertThat(u.send("POST","/api/data/"+name,"{\"values\":{\"title\":\"bad\",\"amount\":\"1.001\"}}",true).statusCode()).isEqualTo(400);
        assertThat(u.send("POST","/api/data/"+name,"{\"values\":{\"title\":\"bad\",\"amount\":\"1.00\",\"created_by\":\"forged\"}}",true).statusCode()).isEqualTo(400);
        assertThat(u.get("/api/data/"+name).get("total").asLong()).isEqualTo(1);
    }
    @Test void ownershipAppliesToListsCountsDetailHistoryAndUpdates() throws Exception {
        var a=admin();var u=demo();String name=object(a);publish(a,name);var hidden=record(a,name);var own=record(u,name);
        assertThat(a.get("/api/data/"+name).get("total").asLong()).isEqualTo(2);
        assertThat(u.get("/api/data/"+name).get("total").asLong()).isEqualTo(1);
        String path="/api/data/"+name+"/"+hidden.get("id").asText();
        assertThat(u.send("GET",path,null,false).statusCode()).isEqualTo(404);
        assertThat(u.send("GET",path+"/history",null,false).statusCode()).isEqualTo(404);
        assertThat(u.send("PUT",path,mapper.writeValueAsString(Map.of("version",1,"values",Map.of("title","bad","amount","1.00"))),true).statusCode()).isEqualTo(404);
        assertThat(u.get("/api/data/"+name+"/"+own.get("id").asText()).get("createdBy").asText()).isEqualTo(u.get("/api/auth/me").get("id").asText());
        assertThat(u.get("/api/data/"+name+"?search="+encode("' OR 1=1 --")).get("total").asLong()).isZero();
    }
    @Test void failedPublicationRollsBackAllDdlAndKeepsPriorVersion() throws Exception {
        var a=admin();String name=object(a);var initial=publish(a,name);var row=record(a,name);
        add(a,name,"optional_note","TEXT",false);var draft=add(a,name,"required_note","TEXT",true);
        assertThat(a.send("POST","/api/metadata/objects/"+name+"/publish","{}",true).statusCode()).isEqualTo(409);
        var unchanged=a.get("/api/metadata/objects/"+name);assertThat(unchanged.get("version").asInt()).isEqualTo(1);
        String table="biz_"+initial.get("id").asText().replace("-","");
        for(int i=2;i<4;i++){
            var field=unchanged.get("fields").get(i);assertThat(field.get("published").asBoolean()).isFalse();
            assertThat(jdbc.queryForObject("select count(*) from information_schema.columns where table_schema='lcp_business' and table_name=? and column_name=?",Integer.class,table,"f_"+field.get("id").asText().replace("-",""))).isZero();
        }
        assertThat(a.get("/api/data/"+name+"/"+row.get("id").asText()).get("values").get("amount").asText()).isEqualTo("9007199254740993.21");
        a.write("DELETE","/api/metadata/objects/"+name+"/fields/"+draft.get("fields").get(3).get("id").asText(),Map.of());
        assertThat(publish(a,name).get("version").asInt()).isEqualTo(2);
        assertThat(a.get("/api/data/"+name+"/"+row.get("id").asText()).get("values").get("optional_note").isNull()).isTrue();
    }
    @Test void staleUpdatesAreRejectedAndOnlyCommittedWritesAreAudited() throws Exception {
        var a=admin();var u=demo();String name=object(a);publish(a,name);var row=record(u,name);String path="/api/data/"+name+"/"+row.get("id").asText();
        var body=Map.of("version",1,"values",Map.of("title","修改后的单据","amount","5.25"));
        assertThat(u.write("PUT",path,body).get("version").asInt()).isEqualTo(2);
        assertThat(u.send("PUT",path,mapper.writeValueAsString(body),true).statusCode()).isEqualTo(409);
        assertThat(u.get(path).get("values").get("amount").asText()).isEqualTo("5.25");
        assertThat(u.get(path+"/history").size()).isEqualTo(2);
    }
    @Test void namesAndSortFieldsCannotIntroduceSql() throws Exception {
        var a=admin();
        assertThat(a.send("POST","/api/metadata/objects","{\"name\":\"x;drop table bad\",\"label\":\"bad\"}",true).statusCode()).isEqualTo(400);
        String name=object(a);publish(a,name);
        assertThat(a.send("GET","/api/data/"+name+"?sort="+encode("amount;drop table bad"),null,false).statusCode()).isEqualTo(400);
        assertThat(a.get("/api/data/"+name).get("total").asLong()).isZero();
    }
}
