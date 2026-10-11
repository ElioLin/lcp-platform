# NocoBase · 固定版本源码尽调

**v2.2.23 / 3b7958ce95ebd2a5467fa0de991f627d1820dfc4**，B 类。默认 main snapshot 另见登记表，不补入后续功能。Node/TS、Koa/Sequelize、React、SQL driver。许可不是仅一张 Apache 图标；根补充协议与旧 AGPL 文件头的冲突需独立核定。

## A · 对象/字段到 API 与页面

`collections.afterSaveWithAssociations` → `CollectionModel.migrate` → `load` 注册 collection/fields → `collection.sync({force:false,alter:{drop:false},transaction})`。字段 `FieldModel.load` 用 `setField`，有 transaction rollback 删除内存字段的 listener。这里有真实运行时建模路径，普通对象不是必须生成 controller/class 后重建部署。[N-HOOK](https://github.com/nocobase/nocobase/blob/3b7958ce95ebd2a5467fa0de991f627d1820dfc4/packages/plugins/%40nocobase/plugin-data-source-main/src/server/server.ts#L119-L138) [N-DDL](https://github.com/nocobase/nocobase/blob/3b7958ce95ebd2a5467fa0de991f627d1820dfc4/packages/plugins/%40nocobase/plugin-data-source-main/src/server/models/collection.ts#L199-L245) [N-FIELD](https://github.com/nocobase/nocobase/blob/3b7958ce95ebd2a5467fa0de991f627d1820dfc4/packages/plugins/%40nocobase/plugin-data-source-main/src/server/models/field.ts#L53-L88)

Sequelize Repository 的 create 与关联写入使用同一 transaction；这是主子保存可复用的依据，不证明全部 bulk/多 datasource 为一个原子事务。自动 data resource 与 schema UI 属平台设计，但本轮没有验证新增对象后的 V2 页面、恢复、主明细键盘操作。[N-REPO](https://github.com/nocobase/nocobase/blob/3b7958ce95ebd2a5467fa0de991f627d1820dfc4/packages/core/database/src/repository.ts#L679-L723)

**UNVERIFIED**：跨对象关联 DDL 并发、非空字段存量数据、字段改类型/删除、聚合/导出权限、实时 UI schema/多进程 cache 消息可靠性、PG 目标版本。不会把 `drop:false` 当完整生产变更治理。

## B · 身份、权限、事务、审计

Application 初始化 AuthManager 并在 datasource 默认处理前安装 auth middleware；query ACL 从已解析用户/角色算 object action 权限，裁剪 fields/measures/dimensions/orders/having 并合并行范围。权限不只隐藏按钮。[N-AUTH](https://github.com/nocobase/nocobase/blob/3b7958ce95ebd2a5467fa0de991f627d1820dfc4/packages/core/server/src/application.ts#L1306-L1332) [N-QUERY-ACL](https://github.com/nocobase/nocobase/blob/3b7958ce95ebd2a5467fa0de991f627d1820dfc4/packages/plugins/%40nocobase/plugin-acl/src/server/query/apply-query-permission.ts#L238-L295)

关键边界：Workflow `CreateInstruction` 和 `QueryInstruction` 直接使用 repository。create 的 context 在此路径只设置 execution stack；query 没走已追踪的 HTTP query ACL helper。因此不能从数据 API 权限推导 Flow 一定以触发用户的相同对象/字段/记录权限执行。这是语义/扩展门槛，尚未运行证明一个普通用户可或不可越权；没有将静态路径宣布为已确认漏洞。[N-FLOW-CREATE](https://github.com/nocobase/nocobase/blob/3b7958ce95ebd2a5467fa0de991f627d1820dfc4/packages/plugins/%40nocobase/plugin-workflow/src/server/instructions/CreateInstruction.ts#L36-L69) [N-FLOW-QUERY](https://github.com/nocobase/nocobase/blob/3b7958ce95ebd2a5467fa0de991f627d1820dfc4/packages/plugins/%40nocobase/plugin-workflow/src/server/instructions/QueryInstruction.ts#L42-L71)

需要的 LCP 工作包：可信事件入口捕获 actor、队列保留 actor/授权上下文、执行时重新判权、记录 trace、禁止客户端注入 actor；提供受控指令/Action 调用入口并限制普通 Flow 使用原生 privileged repository 指令。`registerInstruction` 是真实扩展点，但现有指令的替换范围、异步恢复与商业审批执行语义未验证。[N-FLOW-EXT](https://github.com/nocobase/nocobase/blob/3b7958ce95ebd2a5467fa0de991f627d1820dfc4/packages/plugins/%40nocobase/plugin-workflow/src/server/Plugin.ts#L320-L354)

源码中 `plugin-audit-logs` manifest 明确 deprecated 且支持 1.x，不能因目录存在就给 2.2.23 审计全面通过。认证 auditManager 注册与实际持久化/数据历史/配置变化/异步 actor 是不同层面。[N-AUDIT-MANIFEST](https://github.com/nocobase/nocobase/blob/3b7958ce95ebd2a5467fa0de991f627d1820dfc4/packages/plugins/%40nocobase/plugin-audit-logs/package.json#L16-L25)

## C · 配置发布与恢复

社区核心有数据库/plugin migrations、元数据保存与 sync/cache 机制；环境间 configuration migration manager 是 Professional+。它与开发人员升级 plugin migration class 不同。没有获取商业模块，所以依赖检查、生产差异应用、冲突、失败回退、数据不被配置包覆盖等只按官方说明记 `DOC_ONLY`。[DOC-N-MIGRATION](https://docs.nocobase.com/plugins/@nocobase/plugin-migration-manager)

不建议复制库后改 UI 即采用。先证明迁移计划/备份/恢复与身份权限方案是否能作为独立 LCP plugin 实现；需要改 CollectionModel、ACL 或原生 Flow dispatcher 时标出受限核心补丁及跟踪责任，不能叫“小适配”。

## D · Action Schema 与 MCP

`plugin-mcp-server` 使用 SDK 的真实 Streamable HTTP server。tools/list 从已配 registry 列工具；tools/call 传当前 request token。工具来源可合并启用插件/核心的 OpenAPI，使用 `openapi-mcp-generator` 生成 tool 后 `inject(app.callback())` 调原 application 请求链。不是仅 MCP Client。[N-MCP](https://github.com/nocobase/nocobase/blob/3b7958ce95ebd2a5467fa0de991f627d1820dfc4/packages/plugins/%40nocobase/plugin-mcp-server/src/server/mcp-server.ts#L87-L171) [N-MCP-TOOLS](https://github.com/nocobase/nocobase/blob/3b7958ce95ebd2a5467fa0de991f627d1820dfc4/packages/plugins/%40nocobase/plugin-mcp-server/src/server/mcp-tools.ts#L304-L400)

但 package patterns 默认空、OpenAPI/工具有启用范围；并未证明任意新对象的所有字段 Schema/任意 Action 都自动成为精确独立工具。对象 metadata 自动 schema、Action 输入输出版本、按权限工具发现、user token 向异步任务传递、限流与撤权仍需验证。MCP transport 不负责凭空解决 Flow 内核的身份问题。

## E · 插件/业务包/上游升级与退出

Plugin 有 install/load/upgrade/enable/disable/remove 与 sync message 生命周期；Workflow 可注册新 instruction。可优先用官方配置、独立 LCP plugin、业务定义包；避免改 Sequelize/collection/ACL/runtime UI 核心。[N-PLUGIN](https://github.com/nocobase/nocobase/blob/3b7958ce95ebd2a5467fa0de991f627d1820dfc4/packages/core/server/src/plugin.ts#L119-L141) [N-FLOW-EXT](https://github.com/nocobase/nocobase/blob/3b7958ce95ebd2a5467fa0de991f627d1820dfc4/packages/plugins/%40nocobase/plugin-workflow/src/server/Plugin.ts#L320-L354)

技术学习成本是 Koa/Sequelize、NocoBase resource/ACL/Flow/V2 UI model，而不只 TypeScript 语法。多个独立系统应各持自己的 database/app 配置、共用固定上游与 LCP plugin release；逐项目直接改内核会造成升级分叉。数据库备份不是可迁出证明：对象定义、UI、权限/Flow、附件、审批历史、稳定标识还需 exporter/转换方案；商业插件 source 和停续订后能力未知。

## F · 日常业务 UI

React 与已批准前端语言接近，有对象/区块/表单/关联机制；V1/V2 功能和废弃插件不能混算。R01 的全局值集/依赖选项、R15 主明细批量、R16 动态依赖、R17 无障碍、R18 业务标签翻译的完整路径未运行验证。专用 Approval 为 Professional+，不是把社区人工处理节点改名就算完整审批。[DOC-N-APPROVAL](https://docs.nocobase.com/plugins/@nocobase/plugin-workflow-approval)

找到 scope/permission 等测试，未执行；源码有测试不等于安全或发布质量已验证。[N-ACL-TEST](https://github.com/nocobase/nocobase/blob/3b7958ce95ebd2a5467fa0de991f627d1820dfc4/packages/plugins/%40nocobase/plugin-acl/src/server/__tests__/scope.test.ts#L15-L35) 公开 GHSA 样本及所涉插件版本见登记/索引。

**设计建议**：优先补证其内部部署许可、同用户 Flow/Action 扩展与配置迁移；本轮不推荐立即采用。需要服务端换为 Node/TS，jOOQ/Spring 由该 runtime 取代；前端 React/TS 与 PostgreSQL 可保留方向，但数据库版本/Schema/API 不保证直接沿用。
