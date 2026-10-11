# 复用路线、工作包与长期成本

本轮推荐 **INSUFFICIENT_EVIDENCE**。有具体平台价值与扩展接口，但尚不足以判断补齐成本可接受并给出正式采用建议。没有虚构覆盖百分比、开发天数、报价或节省比例。下列是待讨论方案，未实施。

## 整平台：固定上游 + 独立 LCP 扩展包

| 方案 | 直接复用且有证据的部分 | 官方配置/独立扩展 | 受限补丁/核心变化与未知 |
|---|---|---|---|
| NocoBase 2.2.23 | Runtime collections/fields、SQL CRUD/关联事务、HTTP ACL/OpenAPI/MCP transport、plugin生命周期 | LCP业务定义包；可信actor/queue trace；受控Flow instructions；动作Schema/工具生成；企微/集成/配置治理/退出适配 | 同用户权限如何贯穿原生Flow需证明；若改ACL/dispatcher/core collection则持续跟踪patch。Professional+ migration/approval未获；品牌/平台交付/模块授权未核定。 |
| Frappe 16.51.1 | Custom DocType/DDL、Document API与permissions、动态Form基础、job用户恢复、AutomationAction描述/扩展 | 独立LCP app/fixtures/doc_events/automation_actions；默认Flow身份策略；MCP元数据bridge；审批补齐、翻译键/企微/退出exporter | 金额精确Decimal可能侵入ORM/序列化/公式/UI；现有MCP依赖冲突需兼容版本/受限fork/独立transport。全环境发布/失败恢复仍需治理。后台Python与Desk前端变化大。 |
| ObjectStack 17.7.0 | Runtime typed metadata/PG表/内部CRUD已试验；framework Apache；MCP/principal与plugins有源码 | LCP metadata/artifact业务包；受控插件/driver/工具投影；业务约束/通道/出口 | active metadata与DDL失败的一致性需核心/发布通道方案；trusted Action system elevation需更明确权限模型。正确定义生产host、协议/cohort/Console升级与依赖维护。 |

“比自建少做什么”是以上现成存储/建模/API/渲染/权限或队列机制；不把未验证审批、MCP identity、变更恢复计算成已省工作。Java自建也不假定会天然正确实现这些难点。

采用若需不同存储/授权/运行时机制，必须分别批准；不可把三个候选的对象库、权限库、Flow数据直接拼接成LCP统一内核。

## 必须定界的工作包

| 包 | 输入/完成证据 | 成本变量与失败停止条件 |
|---|---|---|
| WP01 授权/交付边界 | 内部/集团/客户/OEM/品牌矩阵；拟用模块的可确认授权 | 是否接受费用/保留品牌、授权主体/实例/配置权限；无法取得明确权利则不进入采用 |
| WP02 普通对象与主明细 | 两个普通对象、真实typed tables、自动API、已有数据加字段与默认值/验证 | 跨对象事务、类型变更、引用与存量恢复；不能要求生成专属代码再发布而仍称运行时 |
| WP03 用户/权限统一 | 两个非管理员，UI/API/aggregate/export/Action/Flow/MCP正反例；停用/撤权后重新判权 | 不只是token透传；actor不能客户端自报；若普通脚本一调用就无边界system提权，需要明确core/能力授权方案 |
| WP04 金额/并发/幂等/事件 | 金额范围、scale/rounding、运算及序列化往返；竞争更新/重复调用/事务事件试验 | Frappe float需真实策略；O数字string/PG numeric不证明所有公式/聚合；不可依据表类型跳过业务运算 |
| WP05 配置发布/恢复 | 对象/字段/权限/Flow/UI依赖包，dry-run、失败、恢复/回退、cache/index验证 | 单项数据库migration和Git不是环境发布；O当前DDL失败场景必须先解决；NC收费模块未见源码 |
| WP06 MCP/Action Schema | 固定transport兼容版本、metadata→工具Schema、发现/调用授权、schema版本与audit | Frappe当前依赖组合不能原样安装；不得每对象手写适配；generic工具也需明确是否满足产品形式 |
| WP07 审批/长流程/集成 | 多级/会签/或签、任务权限/锁、重试/版本、映射/secret/幂等/调用日志 | 原生/商业/自写逐项定界；不得把同步hook/状态机当完整Flow |
| WP08 UI/中文/i18n | 主明细、默认值/依赖、错误焦点、键盘/无障碍、稳定值/标签、翻译迁移 | 替换Frappe Desk为React需自建更多渲染协议；NC V1/V2或O Console并非无成本皮肤 |
| WP09 运维/升级 | 官方环境、固定runtime与扩展包、构建/测试/安全补丁、独立实例升级 | PG/Redis/worker/host等按实际启用能力计；Java/Python/Node与独特DSL学习、每个kernel patch重放 |
| WP10 退出 | 元数据/稳定ID、typed data、附件关系、permissions、workflow/approval/audit/config history导出与转换 | backup只能恢复同平台，不等于migration out；停维护/改license/停订阅时的替代路径 |

只有WP的边界/接口和验收场景足够明确，才能估算人员/工期/生命周期成本。费用、每系统升级频度、actor约束、数据量/金额范围、可接受停机窗口目前未知，不报数字。

## 组件复用方案（尚未选定）

可能独立复用的接口/设计：ObjectStack typed metadata与action contracts（Apache），Nop kernel/DSL/增量合并（拟用模块需核定授权），Twenty MIT SDK/UI与App接口（各包授权），成熟MCP SDK/流程/通知基础库。以上不能同时各自管理“事实对象”“权限”“事务”，必须有一个LCP内核所有者和清楚的适配边界。

本轮尚未固定和验证一组能直接组合满足目标的独立组件，因此不输出 `COMPOSE_COMPONENTS`。Frappe MCP 不是成熟即插即用组件；ObjectStackSQL/安全/metadata等紧密配套，抽出若干包可能保留大部分framework依赖，不能称“只拿几个小组件”。

## 自建内核方案（待讨论，未恢复开发）

若复用门槛确认无法接受，可按既定Java/Spring/jOOQ/PG、React/TS讨论BUILD_CORE。LCP需自己承担元数据版本/依赖/DDL发布、统一权限query/action/flow/mcp执行边界、动态UI、事务/并发/事件、审批/集成与退出。成熟数据库/驱动/认证/协议/组件仍可复用，具体版本与许可另定。

自建优势是直接对齐受控权限、精确金额与发布契约，成本是这些内核本身的长期设计、实现、测试和安全维护；不能因为已有批准语言就认为更便宜或更成熟。当前有限初筛不足以宣告没有整平台适配路线，不直接输出BUILD_CORE。

## 长期维护与退出选择

- 上游原版 + 配置/业务包优先；独立plugin次之。需要patch时记录触发条件、最小范围、上游版本/cohort、每次升级的重放/回归负责人。
- 各CRM/ERP/MES/WMS/PMS独立database/deployment，统一extension版本契约；共享业务包不应强迫所有系统同日升级。一个shared Bench/运行时若耦合全部实例，需明确独立部署策略。
- 所选依赖停止维护或许可变化时，固定老版本只能暂时保留已有权利，不能解决安全补丁来源。迁出必须包含附件/关系/流程历史与配置解释器替代，不只SQLdump。
- 商业模块永久许可/续订升级/activation/offline/source/binary/OEM分别核定。没有证据时不臆测停订阅效果。
