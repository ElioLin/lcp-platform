# ObjectStack · 固定版本源码与运行尽调

**17.7.0 package cohort / 4e4e881427a8b8b57696ad5bdb12792f2dac6556**。查询 release 为 `create-objectstack@17.7.0`，所读 spec/CLI同版本。默认 main SHA另列，不能补入之后的 v18 变更。本库开源 framework/production runtime 为 Apache；商业 ObjectOS 是另外产品，不能把 ObjectOS UI AI/运营治理权益加入本库。[O-VERSION](https://github.com/objectstack-ai/objectstack/blob/4e4e881427a8b8b57696ad5bdb12792f2dac6556/packages/spec/package.json#L1-L12) [O-LICENSE](https://github.com/objectstack-ai/objectstack/blob/4e4e881427a8b8b57696ad5bdb12792f2dac6556/LICENSE#L1-L177) [O-EDITION](https://github.com/objectstack-ai/objectstack/blob/4e4e881427a8b8b57696ad5bdb12792f2dac6556/LICENSING.md#L1-L19)

## A · runtime metadata → typed table → CRUD

`saveMetaItem(mode:publish)` → `repo.put` 保存 active 元数据/历史 → registry write-through → `ensureObjectStorage` → ObjectQL `syncObjectSchema` → SQL driver `syncSchema/initObjects`。运行时对象/字段路径真实，不是只有 Zod 定义或 `os compile` 构建步骤。[O-META](https://github.com/objectstack-ai/objectstack/blob/4e4e881427a8b8b57696ad5bdb12792f2dac6556/packages/metadata-protocol/src/protocol.ts#L20460-L20492) [O-SQL](https://github.com/objectstack-ai/objectstack/blob/4e4e881427a8b8b57696ad5bdb12792f2dac6556/packages/drivers/driver-sql/src/sql-driver.ts#L11649-L11655)

Node 24.13.0、已发行 `@objectstack/runtime@17.7.0`、专用 PostgreSQL 18.1，standalone kernel（Metadata + ObjectQL + default datasource）实测：通过程序化 protocol 保存 `pre_request`，自动出现物理表；subject=text、amount=numeric(65,30)；写入合成记录；追加 note 列，无重建对象代码或重启。新增列后原记录仍在、note 为 null、金额读回 `12.340...`。这是内部 protocol/engine 的验证，不是 HTTP API或 UI 验收。[RT-O-DYNAMIC](../RUNTIME_CHECKS.md)

发行包无 npm gitHead，本轮没有证明编译产物与该 source SHA 逐字等价；source 链与运行包分别取证，版本/SRI/lock hash见运行记录。

## B · 身份、权限、事务/审计

SecurityPlugin 在 ObjectQL middleware 层介入；正常请求与 `isSystem` 分支不同。MCP 请求检查已绑定 principal，bridge `callData` 绑定该 request context。源码不是仅前端隐藏。生产组件是否全部正确加载及 actor 贯穿所有调用仍未实际跑两个认证身份。[O-SECURITY](https://github.com/objectstack-ai/objectstack/blob/4e4e881427a8b8b57696ad5bdb12792f2dac6556/packages/plugins/plugin-security/src/security-plugin.ts#L2281-L2329) [O-MCP-GATE](https://github.com/objectstack-ai/objectstack/blob/4e4e881427a8b8b57696ad5bdb12792f2dac6556/packages/runtime/src/domains/mcp.ts#L62-L108) [O-MCP-BRIDGE](https://github.com/objectstack-ai/objectstack/blob/4e4e881427a8b8b57696ad5bdb12792f2dac6556/packages/runtime/src/domains/mcp.ts#L491-L512)

`domains/actions.ts` 说明 trusted script/handler 的 scoped engine/api 用 system elevation；declarative record update 用 caller，flow转发 identity 并按 runAs策略运行。该设计可能适合能力授权后执行可信程序，但与 LCP R09“Action/Flow 不绕过统一数据权限”的要求有偏差，不能按“Action权限已检查”就给逐对象/字段/记录权限通过。需追实际 action executor、受限补丁或经用户批准明确能力级提权模型。[O-ACTION](https://github.com/objectstack-ai/objectstack/blob/4e4e881427a8b8b57696ad5bdb12792f2dac6556/packages/runtime/src/domains/actions.ts#L358-L395)

standalone factory 本身不组装 auth/security/Studio；它是嵌入/迁移等用途，不等于完整生产 host。此次运行没有 HTTP listener，不暴露 unauthenticated API。`os start` 源码会生成/持久化 auth secret，和同 SHA self-hosting 文档中“缺 secret 会跳过 auth”的简述不完全一致，应看具体启动入口而不是拿文档一句话判整个 runtime 不安全。[O-STANDALONE](https://github.com/objectstack-ai/objectstack/blob/4e4e881427a8b8b57696ad5bdb12792f2dac6556/packages/runtime/src/standalone-stack.ts#L1-L62) [O-AUTH-START](https://github.com/objectstack-ai/objectstack/blob/4e4e881427a8b8b57696ad5bdb12792f2dac6556/packages/cli/src/commands/start.ts#L281-L292)

## C · 发布、历史、依赖、缓存与失败恢复

有 draft/publish、parent version、history、registry/write-through 等真实抽象，不能只称 Git保存配置。关键问题是 `ensureObjectStorage` catch 所有 sync exception、只 warn，且调用前已经保存元数据并改变 registry。[O-META](https://github.com/objectstack-ai/objectstack/blob/4e4e881427a8b8b57696ad5bdb12792f2dac6556/packages/metadata-protocol/src/protocol.ts#L20460-L20492) [O-DDL-FAIL](https://github.com/objectstack-ai/objectstack/blob/4e4e881427a8b8b57696ad5bdb12792f2dac6556/packages/metadata-protocol/src/protocol.ts#L18932-L18947)

**真实失败场景**：专用 PG role `pre_restricted`可读写已有 metadata表，但无 schema CREATE；发布新 `pre_ddl_denied`。运行结果 `success:true,state:active`，sys_metadata 中 active row 存在，物理表不存在，日志记录 `permission denied for schema public`。这是同一已发行 runtime 的数据库拒绝 DDL，非 mock、非容器启动失败；它验证此场景的 R03/R19缺口，不代表所有迁移都失败。[RT-O-DDL](../RUNTIME_CHECKS.md)

恢复方案必须同时处理 metadata history、active/draft状态、registry/cache、物理 DDL、依赖/索引及重试。仅改 warn 为 throw仍可能留下先前持久化状态，不能将其当现成完整修复。本轮没有改 source、上游发 Issue/PR或写 LCP补丁。

试验另出现 PostgreSQL index/constraint迁移警告，kernel仍启动；原因、支持的 PG版本与后续影响未继续验证，不宣布兼容所有 PG18能力。

## D · Action Schema / HTTP / MCP

MCP Server和 data/action bridge在开源代码中；generic object tool families及 list_actions/run_action经 capability决定注册，调用走 runtime domain。对象与动作定义可动态发现，但与“每个对象/Action单独生成一个精确参数工具”不同。若后者是必须形式，仍需独立 schema/tool registry适配；不得用 generic `params`当完成所有动作自描述。[O-MCP-WIRE](https://github.com/objectstack-ai/objectstack/blob/4e4e881427a8b8b57696ad5bdb12792f2dac6556/packages/mcp/src/mcp-http-tools.ts#L489-L519) [O-MCP-BRIDGE](https://github.com/objectstack-ai/objectstack/blob/4e4e881427a8b8b57696ad5bdb12792f2dac6556/packages/runtime/src/domains/mcp.ts#L491-L512)

找到了 OAuth/MCP入口测试，未执行；部分是测试替身，不能把测试文件名写为生产身份已运行验收。[O-MCP-TEST](https://github.com/objectstack-ai/objectstack/blob/4e4e881427a8b8b57696ad5bdb12792f2dac6556/packages/runtime/src/http-dispatcher.mcp-oauth.test.ts#L121-L178) 本轮没有开收费模型、没有写临时完整 MCP给候选补分。

## E · 插件、业务包、升级与退出

ObjectKernel.use 与 ObjectQL/driver/AppPlugin 的可复用装配有源码例子；metadata/driver/security/service均为独立 package。可以优先讨论“固定 framework +独立 LCP metadata业务包/插件”，而不是复制源码改品牌。[O-EXT](https://github.com/objectstack-ai/objectstack/blob/4e4e881427a8b8b57696ad5bdb12792f2dac6556/examples/app-todo/test/seed-check.ts#L12-L25)

成本包括 Zod/协议语义、ObjectQL/metadata repo、driver DDL、security/posture/Action信任边界、artifact/database双轴升级。所读关键 implementation文件本身跨度较大（metadata protocol约2.7万行、SQL driver约2.1万行、security约1万行），这是实际调试/变更定位负担，不以行数直接判质量。核心修复要跟踪上游 package cohort、协议迁移与 Console依赖；不能认为只写 TS就学习成本很小。

Artifact/metadata history 与数据可读有退出基础，但附件/approval/flow/audit history、迁出格式转换和多个独立实例升级兼容性未验收。没有把可移植 JSON等同可独立迁出业务运行时。

## F · UI、Flow/审批、中文

React Console、metadata components、automation/approvals/sharing/pinyin search 等 package确实可见；“存在 schema/package/tests”不等于全部规则已在该版本生产 host兑现。本轮没有浏览器UI、主明细、键盘/无障碍、中文撤权搜索、会签或流程续跑实验。商业 ObjectOS能力不作免费加分。

**设计建议**：高度相关的非 Java备选；先取得发布恢复与Action权限方案、正确生产装配的双用户试验及出口证据。动态PG建模值得复用研究，但已复现缺口使本轮不支持立即采用。若未来采纳，后端会改为Node/TS/ObjectQL/Knex；React/TS/PG方向可保持，Spring/jOOQ baseline不能未经批准被替换。
