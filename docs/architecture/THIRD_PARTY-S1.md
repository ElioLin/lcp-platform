# S1 第三方组件与产品授权边界

当前以自建 LCP 核心配合依赖包实现，不复制开源候选平台到产品目录，也不购买商业功能。

| 组件范围 | 核心许可 / 官方入口 |
|---|---|
| Spring Boot / Framework / Security / Session | Apache-2.0；[Spring Boot](https://github.com/spring-projects/spring-boot)、[Spring Session](https://github.com/spring-projects/spring-session) |
| jOOQ 开源版 | Apache-2.0；仅使用 `org.jooq` 社区发行与 PostgreSQL；[正文](https://github.com/jOOQ/jOOQ/blob/version-3.21.7/LICENSE.txt) |
| Flyway 社区代码 | Apache-2.0；不使用 Teams/Enterprise 能力；[固定版本声明](https://github.com/flyway/flyway/blob/flyway-12.4.0/LICENSE.txt) |
| PostgreSQL | PostgreSQL License；[许可](https://www.postgresql.org/about/licence/) |
| Temurin/OpenJDK | GPLv2 with Classpath Exception；JDK运行与产品代码许可区分；[Adoptium许可入口](https://adoptium.net/about/) |
| React、Ant Design、TanStack Query、Router、decimal.js | 各包的 MIT 声明；确切依赖来自 package.json / pnpm-lock.yaml |
| TypeScript / Playwright | Apache-2.0；分别使用正式6.0.3 / 1.64.0 |

平台迁移中的 Spring Session 表结构按其 PostgreSQL schema 接口适配，保留其来源与 Apache-2.0 范围说明。实际分发阶段须随依赖包保留适用的 LICENSE/NOTICE，不凭此短清单推定所有传递依赖已经完整审计。

本文件是本阶段使用范围记录，不是完整SBOM/法律意见。LCP自有代码的正式许可尚未由用户确定；公开Git仓库不自动代表自有代码已授予MIT/Apache等开源许可。未来私有化交付、闭源扩展及品牌保留是架构约束，不等同于已经取得所有商标或第三方授权。

没有采用Keycloak、Flowable、Spring AI、图形流程编辑器或候选平台的商业模块；这些后续引入时单独核定具体版本、模块许可与兼容性。
