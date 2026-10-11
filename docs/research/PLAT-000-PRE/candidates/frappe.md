# Frappe Framework · 固定版本源码尽调

**v16.51.1 / 2871914b69b6e14a4b023d9b7cc52dc3e269cc1b**，B 类。与 ERPNext、其它 app、Frappe Cloud 合同分别评价；本轮仅 Framework 核心。MIT 不替代其它业务包/依赖许可。Python 3.14、Node>=24 与 Desk JS/jQuery/Vue 相比既定 Java/React 需重大待批准变化。[F-LICENSE](https://github.com/frappe/frappe/blob/2871914b69b6e14a4b023d9b7cc52dc3e269cc1b/LICENSE#L1-L22) [F-PY](https://github.com/frappe/frappe/blob/2871914b69b6e14a4b023d9b7cc52dc3e269cc1b/pyproject.toml#L5-L85) [F-NODE](https://github.com/frappe/frappe/blob/2871914b69b6e14a4b023d9b7cc52dc3e269cc1b/package.json#L17-L22)

## A · 动态 DocType/字段到物理表与 API/UI

`DocType.validate/check_developer_mode` 明确允许 custom DocType 非 developer mode；`on_update` → `frappe.db.updatedb(name,Meta(self))` → PG schema create/alter。只有 non-custom 才导出 controller templates。Custom 普通业务对象无需对象专属 Python controller 才能保存/启用。Single/Virtual DocType 的存储例外不能代表所有普通对象。[F-CUSTOM](https://github.com/frappe/frappe/blob/2871914b69b6e14a4b023d9b7cc52dc3e269cc1b/frappe/core/doctype/doctype/doctype.py#L328-L344) [F-MODEL](https://github.com/frappe/frappe/blob/2871914b69b6e14a4b023d9b7cc52dc3e269cc1b/frappe/core/doctype/doctype/doctype.py#L532-L578) [F-DDL](https://github.com/frappe/frappe/blob/2871914b69b6e14a4b023d9b7cc52dc3e269cc1b/frappe/database/postgres/schema.py#L8-L56)

PG table 有强类型字段；child DocType 持有 parent/parentfield/parenttype。REST resource 自动使用 Document.insert/save、get_list、read/field-level permission。前端 Form/Grid 读取 DocField，动态显隐/必填/readonly 来自字段定义；前端依赖规则不证明 API 全部规则相同。[F-API](https://github.com/frappe/frappe/blob/2871914b69b6e14a4b023d9b7cc52dc3e269cc1b/frappe/api/v1.py#L12-L88) [F-UI](https://github.com/frappe/frappe/blob/2871914b69b6e14a4b023d9b7cc52dc3e269cc1b/frappe/public/js/frappe/form/layout.js#L717-L745)

**决定性偏差**：PG Currency 用 decimal(21,9)，但 driver 全局 `DEC2FLOAT` 将 decimal 转成 Python float；BaseDocument 对 float-like 字段还做 `flt` 转换。不能把物理 numeric 等同 Java BigDecimal 式全链路精度。若 LCP 要精确十进制运算/序列化，需要明确数值范围/舍入契约并验证；要求通用精确 Decimal 时可能涉及 ORM/序列化/公式/聚合/UI 核心变化，不能轻描淡写为一个字段插件。没有宣称 Frappe 所有金额都错误。[F-NUMERIC](https://github.com/frappe/frappe/blob/2871914b69b6e14a4b023d9b7cc52dc3e269cc1b/frappe/database/postgres/database.py#L129-L140) [F-DECIMAL](https://github.com/frappe/frappe/blob/2871914b69b6e14a4b023d9b7cc52dc3e269cc1b/frappe/database/postgres/database.py#L32-L39) [F-CAST](https://github.com/frappe/frappe/blob/2871914b69b6e14a4b023d9b7cc52dc3e269cc1b/frappe/model/base_document.py#L545-L561)

## B · 身份、对象/字段/记录权限、事务/审计

Auth 验证 OAuth token 后从服务器 token 记录取 user，普通 API key/secret 验证亦绑定已启用用户；不是客户端报 username 即可信。API read 检查 read permission 与 field redaction；DatabaseQuery 默认 session user，Document 保存走权限。[F-AUTH](https://github.com/frappe/frappe/blob/2871914b69b6e14a4b023d9b7cc52dc3e269cc1b/frappe/auth.py#L629-L745) [F-API](https://github.com/frappe/frappe/blob/2871914b69b6e14a4b023d9b7cc52dc3e269cc1b/frappe/api/v1.py#L12-L88) [F-QUERY](https://github.com/frappe/frappe/blob/2871914b69b6e14a4b023d9b7cc52dc3e269cc1b/frappe/model/db_query.py#L139-L151)

Administrator 可绕过；`frappe.get_all`、raw SQL、`ignore_permissions` 是可信服务器代码可用的绕过面。统一权限需要管住 LCP Action/Flow/MCP 扩展代码，不能认为有 Role Permission Manager 就所有入口受同一过滤。[F-PERM](https://github.com/frappe/frappe/blob/2871914b69b6e14a4b023d9b7cc52dc3e269cc1b/frappe/permissions.py#L81-L121) [F-GETALL](https://github.com/frappe/frappe/blob/2871914b69b6e14a4b023d9b7cc52dc3e269cc1b/frappe/__init__.py#L1386-L1408)

后台 job 恢复 enqueue 保存的 user；v16 Automation Flow 支持 Triggering User、Document Owner、配置 Automation User，但默认 Automation User/Administrator。AI 委托需要明确要求 Triggering User、可信队列 actor、执行时撤权/停用用户检查及跨同步异步 trace；不能默默接受默认管理员身份。[F-JOB](https://github.com/frappe/frappe/blob/2871914b69b6e14a4b023d9b7cc52dc3e269cc1b/frappe/utils/background_jobs.py#L239-L280) [F-FLOW-DEFAULT](https://github.com/frappe/frappe/blob/2871914b69b6e14a4b023d9b7cc52dc3e269cc1b/frappe/automation/doctype/automation_flow/automation_flow.py#L128-L134) [F-FLOW-IDENTITY](https://github.com/frappe/frappe/blob/2871914b69b6e14a4b023d9b7cc52dc3e269cc1b/frappe/automation_engine/runner.py#L175-L196)

框架 DocumentVersion、日志等可复用，但 data/config/AI/集成链统一审计、保留期限、异常事务日志及 outbox/事件一致性没有验收。

## C · 版本、依赖、迁移与失败恢复

迁移阶段包含 patches、schema、fixtures、customizations 等；`atomic` wrapper 是阶段 commit/rollback，PG create 自身显式 commit，不能等同整套环境原子发布。元数据 cache 在 DocType update 后清理，不证明搜索/多进程索引全部一致。[F-MIGRATE](https://github.com/frappe/frappe/blob/2871914b69b6e14a4b023d9b7cc52dc3e269cc1b/frappe/migrate.py#L46-L73) [F-MIGRATE-PHASE](https://github.com/frappe/frappe/blob/2871914b69b6e14a4b023d9b7cc52dc3e269cc1b/frappe/migrate.py#L145-L180) [F-DDL](https://github.com/frappe/frappe/blob/2871914b69b6e14a4b023d9b7cc52dc3e269cc1b/frappe/database/postgres/schema.py#L8-L56) [F-MODEL](https://github.com/frappe/frappe/blob/2871914b69b6e14a4b023d9b7cc52dc3e269cc1b/frappe/core/doctype/doctype/doctype.py#L532-L578)

可用 app/fixtures/customizations 管定义，但 LCP 仍需依赖图、变更计划/批准、受控 Metadata API、停机/在线政策、生产备份与失败恢复试验。自定义对象、属性修订、权限与 Flow history 的出口需单独实现，不能把 `bench backup` 称为跨平台迁出。

## D · Action 自描述与 MCP 的实际边界

v16 AutomationAction 有 `params_schema/output_schema/transactional`；`automation_actions` hook 可注册 app classes，CreateDocument 通过 Document.insert 保存。不是仅传统 Workflow 状态机。一般按钮/whitelisted method 并不自动等同统一带版本 Action registry，仍需 LCP 可发现、受控执行协议。[F-ACTION-SCHEMA](https://github.com/frappe/frappe/blob/2871914b69b6e14a4b023d9b7cc52dc3e269cc1b/frappe/automation_engine/actions/base.py#L65-L114) [F-ACTION-EXT](https://github.com/frappe/frappe/blob/2871914b69b6e14a4b023d9b7cc52dc3e269cc1b/frappe/automation_engine/actions/base.py#L121-L150) [F-ACTION-CREATE](https://github.com/frappe/frappe/blob/2871914b69b6e14a4b023d9b7cc52dc3e269cc1b/frappe/automation_engine/actions/core.py#L96-L132)

官方组织另有 **frappe/mcp / 11d5076b1bf4483b2ff6751a13e0736f5396b1e6**，源码版本 **0.1.1**；PyPI 正式最新为 **0.1.0**。独立 MIT，源码明确高度实验。注册入口默认不 allow_guest，接普通 Frappe whitelist/request；工具 list/call 来自显式 registry，call 最终执行 `fn(**arguments)`，授权取决于 tool 实现。`add_tool` 能作为 metadata bridge 扩展点，但没有自动 DocType/Action 工具生成证明。[FM-REGISTER](https://github.com/frappe/mcp/blob/11d5076b1bf4483b2ff6751a13e0736f5396b1e6/frappe_mcp/server/server.py#L64-L119) [FM-CALL](https://github.com/frappe/mcp/blob/11d5076b1bf4483b2ff6751a13e0736f5396b1e6/frappe_mcp/server/tools/handlers.py#L13-L49) [FM-LIST](https://github.com/frappe/mcp/blob/11d5076b1bf4483b2ff6751a13e0736f5396b1e6/frappe_mcp/server/tools/handlers.py#L69-L104) [FM-ADD](https://github.com/frappe/mcp/blob/11d5076b1bf4483b2ff6751a13e0736f5396b1e6/frappe_mcp/server/server.py#L205-L217) [FM-EXPERIMENTAL](https://github.com/frappe/mcp/blob/11d5076b1bf4483b2ff6751a13e0736f5396b1e6/README.md#L34-L37)

**当前版本组合冲突已静态证实**：Framework `Werkzeug==3.1.6`、`pydantic~=2.12.5`；所读 MCP 源码及 PyPI 0.1.0要求 `Werkzeug==3.1.3`、`pydantic~=2.11.7`。不能由同一解析环境同时满足。未安装、未运行 pip resolver、未修改约束，不能说已经验证兼容或所有未来版本不兼容。[F-PY](https://github.com/frappe/frappe/blob/2871914b69b6e14a4b023d9b7cc52dc3e269cc1b/pyproject.toml#L5-L85) [FM-DEPS](https://github.com/frappe/mcp/blob/11d5076b1bf4483b2ff6751a13e0736f5396b1e6/pyproject.toml#L13-L22) [FM-PYPI](https://pypi.org/pypi/frappe-mcp/json)

LCP MCP 方案工作包至少包括：可兼容 WSGI transport、DocField/Action Schema 映射、显式 allowed operations、服务器用户绑定、工具发现/调用双重判权、队列 actor、限流与审计；不临时写完整 MCP 给候选补分。

## E · 扩展、业务包、升级与退出

真正可用的 app hooks：`doc_events`、`extend_doctype_class`/override（后者升级侵入更强）、`automation_actions`、资产/导航配置等。以独立 LCP app 加配置/fixtures 优于复制 Framework 核心。[F-HOOK](https://github.com/frappe/frappe/blob/2871914b69b6e14a4b023d9b7cc52dc3e269cc1b/frappe/model/document.py#L1651-L1671) [F-ACTION-EXT](https://github.com/frappe/frappe/blob/2871914b69b6e14a4b023d9b7cc52dc3e269cc1b/frappe/automation_engine/actions/base.py#L121-L150)

服务端学习是 DocType/Document ORM、Bench/sites、hooks/fixtures/patches、Python worker 与 JS Desk，不只是 Python 语法。每系统应有独立 site/database/部署包，避免共用一个 Bench 升级所有生产 app 而产生版本强绑定。要求原 React 完全取代 Desk 会失去较多已可复用动态表单/主明细能力，成本需单列，不能只改皮肤预算。

数据/元数据可读并不保证附件关系、DocShare、Workflow/AutomationRun、审计/配置历史完整迁出；必须建 package/version 导出协议与转换工具。

## F · 工作流/审批、搜索与 UI

Workflow transitions 检查合法动作/自审批并采用 Document save/submit/cancel；这是状态控制/审批基础，不代表已实现所有会签/或签/任务授权/通知规则。新版 Automation 能配置触发、条件、分支/等待等，长任务快照与 retry 路径有源代码，但未运行验证全部 R10。[F-WORKFLOW](https://github.com/frappe/frappe/blob/2871914b69b6e14a4b023d9b7cc52dc3e269cc1b/frappe/model/workflow.py#L120-L152) [F-WORKFLOW-STATE](https://github.com/frappe/frappe/blob/2871914b69b6e14a4b023d9b7cc52dc3e269cc1b/frappe/model/workflow.py#L199-L223) [F-FLOW-IDENTITY](https://github.com/frappe/frappe/blob/2871914b69b6e14a4b023d9b7cc52dc3e269cc1b/frappe/automation_engine/runner.py#L175-L196)

global search 先限制可读 DocType，再对结果 `doc.has_permission()`；字段级内容泄漏、中文分词/精确搜索、撤权时效仍未证实。[F-SEARCH](https://github.com/frappe/frappe/blob/2871914b69b6e14a4b023d9b7cc52dc3e269cc1b/frappe/utils/global_search.py#L480-L543) 键盘、主明细 UI、错误定位、多语言值/标签、共享值集/依赖选项完整体验未做浏览器验收。前端 layout 条件显隐有代码，不能代替服务端验证。[F-UI](https://github.com/frappe/frappe/blob/2871914b69b6e14a4b023d9b7cc52dc3e269cc1b/frappe/public/js/frappe/form/layout.js#L717-L745)

权限/导出测试已找到未运行。[F-PERM-TEST](https://github.com/frappe/frappe/blob/2871914b69b6e14a4b023d9b7cc52dc3e269cc1b/frappe/tests/test_permissions.py#L107-L132) 本机未准备其官方 Linux/完整 Python3.14/Redis/Bench 试验环境；此项为运行证明限制，不作为 Frappe 功能失败。

**设计建议**：保留为最有价值的整平台替代之一；先解决金额契约、MCP 版本组合和真实双用户权限/配置恢复验证。若这些可局部补足并批准换栈，复用可省掉 DocType/DDL、自动 API、动态表单/权限、队列与部分 Automation 的自建；当前不足以给采用通过。
