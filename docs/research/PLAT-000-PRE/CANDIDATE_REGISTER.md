# 候选、版本与初筛

12 个平台仓库入口，11 个候选家族；Steedos/ObjectStack 具有官方演进关系，按代际分开而不当作两个互不相关的重复计数。另有 frappe/mcp 附属库。A/B/C 含义见 REQUIREMENTS；语言不作硬淘汰项。

## 固定版本（查询时的快照）

发布日期列是 GitHub `published_at`，为 UTC；转换到本地须加 8 小时。获取时间、所属组织、官方文档、archived、维护/公告样本见 EVIDENCE_INDEX。所有仓库查询时 `archived=false`，这只说明没有归档。

| ID | 权威仓库 | 实际审查版本 | 实际审查完整 SHA | GitHub 正式发布日期 UTC | 默认分支 / 查询时完整 HEAD | 分类 |
|---|---|---|---|---|---|---|
| steedos | [steedos/steedos-platform](https://github.com/steedos/steedos-platform) | v2.7.32 | `82aae0733f2d4873eec08bce85b655cc5d3e4666` | 2026-02-04T09:53:34Z | 3.0 / `db942fdddbdb34644fb470f015bd0f351ec0ca92` | B |
| objectstack | [objectstack-ai/objectstack](https://github.com/objectstack-ai/objectstack) | create-objectstack@17.7.0 | `4e4e881427a8b8b57696ad5bdb12792f2dac6556` | 2026-10-06T12:23:13Z | main / `55382dc02a2168585a024ba142b98d8bce9910e6` | B |
| nocobase | [nocobase/nocobase](https://github.com/nocobase/nocobase) | v2.2.23 | `3b7958ce95ebd2a5467fa0de991f627d1820dfc4` | 2026-10-11T13:22:48Z | main / `b28af0bd153a052f95adde6ac3322080807d3316` | B |
| corteza | [cortezaproject/corteza](https://github.com/cortezaproject/corteza) | 2024.9.10 | `3835dfc4ac8bd89381753f09042ad147a4502576` | 2026-08-27T14:41:31Z | 2024.9.x / `3835dfc4ac8bd89381753f09042ad147a4502576` | B |
| frappe | [frappe/frappe](https://github.com/frappe/frappe) | v16.51.1 | `2871914b69b6e14a4b023d9b7cc52dc3e269cc1b` | 2026-10-11T12:22:26Z | develop / `44d7ce7d4c0ea71593f6c8621e9c9a1974eda029` | B |
| axelor | [axelor/axelor-open-platform](https://github.com/axelor/axelor-open-platform) | v8.2.4 | `705e2f301eddd1508db75a86c8921f02898df6a4` | 2026-10-07T08:25:52Z | main / `705e2f301eddd1508db75a86c8921f02898df6a4` | A |
| jmix | [jmix-framework/jmix](https://github.com/jmix-framework/jmix) | v3.0.3 | `258a2da9fea93dcc2d4d0a75cb4f9516805d3068` | 2026-10-06T13:08:39Z | master / `e86d892a6f56c1feecfb7091e795bfcc87111484` | A |
| nop | [entropy-cloud/nop-entropy](https://github.com/entropy-cloud/nop-entropy) | 20251210 | `b06ee33095bb302e4305ea8c308703ef99528d2d` | 2025-12-10T14:48:07Z | master / `6e097ee235584d7be46f8a51bb031ef5be5e57f1` | A/C |
| jeecg | [jeecgboot/JeecgBoot](https://github.com/jeecgboot/JeecgBoot) | v3.9.5 | `e3b9dc0aefe1943d9772b026f64ed671a7c82802` | 2026-08-27T03:29:52Z | main / `87d7f938d47d2585618bcfc5a31d125801cbff27` | A/C |
| directus | [directus/directus](https://github.com/directus/directus) | v12.5.0 | `4f77933bf9551cac6b289576078783e189b8f4e3` | 2026-10-07T18:44:06Z | main / `8e140f94250834cea0a0fb6eb822cac39ed9faec` | B |
| twenty | [twentyhq/twenty](https://github.com/twentyhq/twenty) | twenty/v2.45.0 | `7e1431c84adbb264db98ab8b8d008a8401b6d4d6` | 2026-10-05T15:27:44Z | main / `2f9bd3aa6bcffe2095beeff19296d53a43819188` | B |
| saltcorn | [saltcorn/saltcorn](https://github.com/saltcorn/saltcorn) | 1.7.0-beta.3 (default-branch snapshot) | `fb166dad6ae0f91f8b7125413e71881d1c2efc52` | GitHub Releases 为空；npm 稳定版见下 | master / `fb166dad6ae0f91f8b7125413e71881d1c2efc52` | B |
| frappe_mcp | [frappe/mcp](https://github.com/frappe/mcp) | 0.1.1 source snapshot; no GitHub Release | `11d5076b1bf4483b2ff6751a13e0736f5396b1e6` | GitHub Releases 为空；PyPI 见下 | main / `11d5076b1bf4483b2ff6751a13e0736f5396b1e6` | C |

ObjectStack 表内 release 是 monorepo 的 `create-objectstack@17.7.0`；所读 spec/CLI/package cohort 同为 17.7.0。没有将根 private manifest 的 4.0.1 当成 runtime 版本，也没有把当前默认分支能力补到 17.7.0。[O-VERSION](https://github.com/objectstack-ai/objectstack/blob/4e4e881427a8b8b57696ad5bdb12792f2dac6556/packages/spec/package.json#L1-L12)

Saltcorn 未取得 GitHub Releases 记录；npm `@saltcorn/cli` 正式 latest 为 **1.6.2**，上传时间 2026-08-05T21:28:44.054Z，`v1.6.2` 解引用 SHA **596c3aed0662156af4d8c5e02d0fdfa4b874c52e**。另读取该稳定 SHA 的 table/许可，未混入 beta 行号。npm metadata 的 gitHead 为 `90d9575a09583457ce8fb2f83f6c1d5947148040`，与 tag SHA 不同，发行包→该 tag 的内容等价未证实。默认 snapshot 与版本字段为 **1.7.0-beta.3**，不能当稳定版。[SC-STABLE](https://github.com/saltcorn/saltcorn/blob/596c3aed0662156af4d8c5e02d0fdfa4b874c52e/packages/saltcorn-data/models/table.ts#L755-L778) [SC-BETA](https://github.com/saltcorn/saltcorn/blob/fb166dad6ae0f91f8b7125413e71881d1c2efc52/packages/saltcorn-data/models/table.ts#L954-L985)

Frappe MCP 默认源码 `__version__=0.1.1`，GitHub Releases 为空；PyPI 可确认最新发行 **0.1.0**，2025-07-07 上传。wheel SHA256 `4147f978eabea5d87ad62ef03fa8ca7891ddf82c11bc3e5e224ffa3673948d18`；对应上游 commit 未证实。源码 snapshot 与 PyPI 版本分别评价，二者均不能冒充 Framework 16.51.1 的稳定内置 MCP。[FM-PYPI](https://pypi.org/pypi/frappe-mcp/json) [FM-DEPS](https://github.com/frappe/mcp/blob/11d5076b1bf4483b2ff6751a13e0736f5396b1e6/pyproject.toml#L13-L22)

Jmix v3.0.3 是可确认 GitHub release/tag；该源码 `gradle.properties` 仍有 `3.0.999-SNAPSHOT` 字面值。正式 Maven 发行包构建/映射未核验，不能把 tag 与每个二进制的版本一致性当已运行证明。

## 架构与初筛理由

| 候选 | 主要技术/存储/运维与构建 | 原生/偏差判断与本轮去向 |
|---|---|---|
| Steedos 2.7.32 | Node/TypeScript，ObjectQL/TypeORM，Creator/Meteor 等历史层；官方 compose 示例以 MongoDB 为核心；Yarn monorepo。SQL adapter 存在。 | 有 Salesforce 式元数据机制，但主线重写、v2/3 许可和 UI 分代，默认 compose 不证明 PG 全链路。保留旧代参考，不将“仅 Mongo”当排除理由。[S-SQL](https://github.com/steedos/steedos-platform/blob/82aae0733f2d4873eec08bce85b655cc5d3e4666/packages/objectql/src/typeorm/driver.ts#L359-L377) [S-COMPOSE](https://github.com/steedos/steedos-platform/blob/82aae0733f2d4873eec08bce85b655cc5d3e4666/docker-compose.yml#L5-L43) [S-REWRITE](https://github.com/steedos/steedos-platform/blob/db942fdddbdb34644fb470f015bd0f351ec0ca92/README.md#L39-L43) |
| ObjectStack 17.7.0 | Node>=22、TS/Zod/ObjectQL/Knex、React Console；PG、SQLite 等 driver；pnpm monorepo，registry runtime 可自托管。商业 ObjectOS 独立。 | 深读；PG 动态模型真实运行。配置发布一致性与 trusted action 提权须补证/修正。没有正式采用。[O-EDITION](https://github.com/objectstack-ai/objectstack/blob/4e4e881427a8b8b57696ad5bdb12792f2dac6556/LICENSING.md#L1-L19) [RT-O-DDL](RUNTIME_CHECKS.md) |
| NocoBase 2.2.23 | Node>=22、TypeScript/Koa/Sequelize、React、PostgreSQL 等；Yarn monorepo；存储、通知、队列等插件按范围配置。 | 深读；最优先补证的业务平台候选之一。动态对象和 UI 有复用价值；身份/Flow 权限、配置迁移/审批版次、补充授权为门槛。[N-DDL](https://github.com/nocobase/nocobase/blob/3b7958ce95ebd2a5467fa0de991f627d1820dfc4/packages/plugins/%40nocobase/plugin-data-source-main/src/server/models/collection.ts#L199-L245) [N-FLOW-QUERY](https://github.com/nocobase/nocobase/blob/3b7958ce95ebd2a5467fa0de991f627d1820dfc4/packages/plugins/%40nocobase/plugin-workflow/src/server/instructions/QueryInstruction.ts#L42-L71) |
| Corteza 2024.9.10 | Go server、Vue/TypeScript，SQL DAL；可选 Corredor 脚本服务；Go modules/vendor + Yarn。 | 默认 record/value JSON 偏离强类型表，但存在 Plain/alias codecs、model ident 配置，尚未证明须重写核心。保留，不宣布不支持。[C-DAL](https://github.com/cortezaproject/corteza/blob/3835dfc4ac8bd89381753f09042ad147a4502576/server/compose/service/module.go#L1464-L1495) |
| Frappe 16.51.1 | Python>=3.14,<3.15、Werkzeug/DocType ORM，Desk JS/jQuery/Vue；PG/MariaDB adapter；Node>=24、Bench、Redis queue/socket 服务等。 | 深读；自建内核的重要替代。Custom DocType、权限、Action/Automation 确认；金额 float、MCP 依赖冲突、换后端/前端与迁移治理有实质成本。[F-MODEL](https://github.com/frappe/frappe/blob/2871914b69b6e14a4b023d9b7cc52dc3e269cc1b/frappe/core/doctype/doctype/doctype.py#L532-L578) [F-DECIMAL](https://github.com/frappe/frappe/blob/2871914b69b6e14a4b023d9b7cc52dc3e269cc1b/frappe/database/postgres/database.py#L32-L39) [F-PY](https://github.com/frappe/frappe/blob/2871914b69b6e14a4b023d9b7cc52dc3e269cc1b/pyproject.toml#L5-L85) |
| Axelor 8.2.4 | Java/Guice/Hibernate、React 19/TS 前端、PostgreSQL，Gradle。不同于 Spring/jOOQ。 | 8.2 已是 React，旧 Angular 印象不适用。强类型 domain 通常 XML→Java；运行时 custom model 用共享 JSON records。存储偏差决定性，不仅按 Java 接近入围。[A-FRONT](https://github.com/axelor/axelor-open-platform/blob/705e2f301eddd1508db75a86c8921f02898df6a4/axelor-front/package.json#L47-L58) [A-JSON](https://github.com/axelor/axelor-open-platform/blob/705e2f301eddd1508db75a86c8921f02898df6a4/axelor-core/src/main/resources/domains/MetaJson.xml#L98-L102) [DOC-A-MODEL](https://docs.axelor.com/adk/8.2/dev-guide/models/models.html) |
| Jmix 3.0.3 | Java/Spring/JPA、Vaadin Flow UI、Gradle；常用 SQL 数据库。 | 开源 Dynamic Attributes 是 EAV；新 Dynamic Model 可建专用动态表，但 Enterprise 订阅且实验，未获源码/验证。不能说“Java 不可能动态对象”，也不能免费拼入核心。[J-EAV](https://github.com/jmix-framework/jmix/blob/258a2da9fea93dcc2d4d0a75cb4f9516805d3068/jmix-dynattr/dynattr/src/main/java/io/jmix/dynattr/model/CategoryAttributeValue.java#L43-L109) [DOC-J-DYNAMIC](https://docs.jmix.io/jmix/dyn-model/index.html) |
| Nop 20251210 | Java 17、NopORM/XDSL/XLang/GraphQL，Spring/Quarkus 模块、AMIS 等 UI，Maven。 | 内置 nop-dyn 纵表偏差；通用动态 ORM 可用 IEntityModel，普通对象端到端发布未追完。DSL/增量合并可研究为组件；许可前提冲突待核定。[P-DYNAMIC](https://github.com/entropy-cloud/nop-entropy/blob/b06ee33095bb302e4305ea8c308703ef99528d2d/docs/dev-guide/nocode/dynamic-orm.md#L1-L65) [P-ORM](https://github.com/entropy-cloud/nop-entropy/blob/b06ee33095bb302e4305ea8c308703ef99528d2d/nop-persistence/nop-orm/src/main/java/io/nop/orm/support/DynamicOrmEntity.java#L36-L49) |
| JeecgBoot 3.9.5 | Java/Spring Boot、MyBatis、Vue 3，Maven；默认脚本偏 MySQL，PG 转库/配置不算已运行。Online 是独立 beta Maven binary。 | 官网核验过的权威上游。并非只有后台模板，但关键 Online/BPM 源码和授权不从根 LICENSE 推定；竞争限制与当前安全公告构成采用门槛。[E-ONLINE](https://github.com/jeecgboot/JeecgBoot/blob/e3b9dc0aefe1943d9772b026f64ed671a7c82802/jeecg-boot/pom.xml#L299-L303) [E-BACK-LIC](https://github.com/jeecgboot/JeecgBoot/blob/e3b9dc0aefe1943d9772b026f64ed671a7c82802/jeecg-boot/LICENSE#L203-L213) |
| Directus 12.5.0 | Node/TS/Knex、Vue studio、SQL introspection、Flows/MCP，pnpm。 | 强 runtime schema 类型相关，当前 MSCL 竞争使用/密钥边界须独立评估；不沿用旧 BSL 财务门槛。未深读不等于功能不支持。[D-LICENSE](https://github.com/directus/directus/blob/4f77933bf9551cac6b289576078783e189b8f4e3/license#L1-L118) |
| Twenty 2.45.0 | NestJS/TS、React 19、TypeORM/PG workspace schema、Redis，Yarn/Nx。 | 实际 metadata migration/DDL 和独立 app 接口/许可例外存在；不能因是 CRM 直接排除。保留候选，完整通用业务包、审批/权限/退出成本未深读。[T-DDL](https://github.com/twentyhq/twenty/blob/7e1431c84adbb264db98ab8b8d008a8401b6d4d6/packages/twenty-server/src/engine/twenty-orm/workspace-schema-manager/services/workspace-schema-table-manager.service.ts#L7-L33) [T-LICENSE](https://github.com/twentyhq/twenty/blob/7e1431c84adbb264db98ab8b8d008a8401b6d4d6/LICENSE#L1-L54) |
| Saltcorn 1.6.2 / beta snapshot | Node/Express、PostgreSQL，SQLite 可选，view/action/plugin 体系，npm。 | 稳定源码也有 runtime physical table。角色/所有权机制与复杂组织/字段权限、审批/发布要求差距待确认；保留轻量备选。[SC-STABLE](https://github.com/saltcorn/saltcorn/blob/596c3aed0662156af4d8c5e02d0fdfa4b874c52e/packages/saltcorn-data/models/table.ts#L755-L778) |
| Frappe MCP（附属库） | Python/Werkzeug/Pydantic，显式 tool registry，MIT；PyPI 0.1.0/源码 0.1.1 snapshot。 | 真实 MCP Server 接口，不是 MCP Client；不是 DocType/Action 自动工具生成器。当前与所评 Framework 依赖不兼容；高度实验，不作为成熟组件通过项。[FM-REGISTER](https://github.com/frappe/mcp/blob/11d5076b1bf4483b2ff6751a13e0736f5396b1e6/frappe_mcp/server/server.py#L64-L119) [FM-LIST](https://github.com/frappe/mcp/blob/11d5076b1bf4483b2ff6751a13e0736f5396b1e6/frappe_mcp/server/tools/handlers.py#L69-L104) |

没有为所有候选建立演示。运行服务数随选用能力变化，未把可选缓存/搜索/脚本服务误写成所有安装必需项；未核验的操作系统、数据库次版本/构建工具最低版本保持待定。

## 维护与安全观察

每个仓库的 `pushed_at`、closed issue/PR 样本与公开公告摘要已列入索引。不以 commits/Stars/机器人更新评分，也不将“closed”当成已修复。值得注意：

- Frappe 所见 5 条公告包含 SMS、SQL、API IP allowlist、记录修改及停用用户通知问题，v16 patched 值最高 16.33.0；审查 tag 为 16.51.1，高于所列修复版本，不表示完成安全验收。
- NocoBase 样本部分明确修复在 2.0.39/2.1.5；另有公告 `patched_versions` 空白，需逐个插件核查，不能仅凭平台 2.2.23 推定全部消除。
- JeecgBoot `GHSA-7wcq-939v-pcrg` 报告范围 3.9.5、`GHSA-4c6j-45p9-rhrw` 范围 3.9.2—3.9.5，patched 值为空，所审版本落在公告范围；这与环境未运行是两个不同问题。
- ObjectStack/Steedos 等 API 返回的当前公告页为空；未知漏洞、依赖漏洞、发布质量没有据此过关。

上游 source/version、报告 Base/Head 是不同标识；以上任何 SHA 都不是报告 Head。
