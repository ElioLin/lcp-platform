# PLAT-000-PRE · 开源底座尽调

研究始于 **2026-10-11**，报告交付于 **2026-10-12（Asia/Shanghai）**。结论：**INSUFFICIENT_EVIDENCE**。目前有值得复用的平台候选，但统一权限、金额精度、配置发布失败恢复及可用版本组合的关键门槛尚未取得足够通过证据。本轮不建议将研究结果直接转为采用决定，也不触发 PLAT-000 骨架开发。

批准基线仍为 Java/Spring/jOOQ/PostgreSQL、React/TypeScript、模块化单体、强类型对象表。没有切换技术栈。非 Java 平台已实际纳入初筛与深读；换栈的取舍见 [待批准 ADR](ADR-0001-STACK-OPTIONS.md)。

范围：12 个平台仓库入口（11 个候选家族，Steedos/ObjectStack 按代际分开）及 1 个 Frappe 官方 MCP 附属库；深读 NocoBase、Frappe、ObjectStack。ObjectStack 做了 2 个真实 PostgreSQL 场景：运行时对象/字段建表与程序化 CRUD；DDL 被拒绝时的发布行为。后者复现了“返回成功、元数据 active、物理表缺失”。两个场景均为无 HTTP 的 standalone kernel；认证、权限、MCP、UI 未运行验收。[RT-O-DYNAMIC](RUNTIME_CHECKS.md) [RT-O-DDL](RUNTIME_CHECKS.md)

| 候选 | 已修正的前提 | 关键采用门槛 |
|---|---|---|
| NocoBase 2.2.23 | 有运行时物理建模与真实 MCP Server，不能归为 CRUD 生成器 | 根补充许可/旧文件头冲突；专业版以上的审批与迁移未获取；Flow 节点直接走 repository，不能凭 HTTP ACL 推定同用户权限贯穿。[N-LICENSE](https://github.com/nocobase/nocobase/blob/3b7958ce95ebd2a5467fa0de991f627d1820dfc4/LICENSE.txt#L49-L101) [N-FLOW-CREATE](https://github.com/nocobase/nocobase/blob/3b7958ce95ebd2a5467fa0de991f627d1820dfc4/packages/plugins/%40nocobase/plugin-workflow/src/server/instructions/CreateInstruction.ts#L36-L69) [DOC-N-MIGRATION](https://docs.nocobase.com/plugins/@nocobase/plugin-migration-manager) |
| Frappe 16.51.1 | Custom DocType 无须专属代码；已有 Automation Flow 与 Action Schema 扩展点 | PostgreSQL decimal 会转 float；默认自动化身份是 Administrator；官方 MCP 库高度实验且当前依赖与该 Framework 冲突，不能拼成“稳定完整能力”。[F-CUSTOM](https://github.com/frappe/frappe/blob/2871914b69b6e14a4b023d9b7cc52dc3e269cc1b/frappe/core/doctype/doctype/doctype.py#L328-L344) [F-DECIMAL](https://github.com/frappe/frappe/blob/2871914b69b6e14a4b023d9b7cc52dc3e269cc1b/frappe/database/postgres/database.py#L32-L39) [F-FLOW-DEFAULT](https://github.com/frappe/frappe/blob/2871914b69b6e14a4b023d9b7cc52dc3e269cc1b/frappe/automation/doctype/automation_flow/automation_flow.py#L128-L134) [FM-DEPS](https://github.com/frappe/mcp/blob/11d5076b1bf4483b2ff6751a13e0736f5396b1e6/pyproject.toml#L13-L22) |
| ObjectStack 17.7.0 | Apache 开源生产 runtime 与商业 ObjectOS 分开；PG 动态表实测成立 | 发布 DDL 错误被吞下已实测；trusted script/handler 的系统提权与 LCP R09 需协调；生产权限/MCP 链未运行验证。[O-EDITION](https://github.com/objectstack-ai/objectstack/blob/4e4e881427a8b8b57696ad5bdb12792f2dac6556/LICENSING.md#L1-L19) [O-DDL-FAIL](https://github.com/objectstack-ai/objectstack/blob/4e4e881427a8b8b57696ad5bdb12792f2dac6556/packages/metadata-protocol/src/protocol.ts#L18932-L18947) [O-ACTION](https://github.com/objectstack-ai/objectstack/blob/4e4e881427a8b8b57696ad5bdb12792f2dac6556/packages/runtime/src/domains/actions.ts#L358-L395) |

**补证优先级（不是采用排序）**：先收敛内部/集团/客户交付及品牌场景、是否接受费用、金额运算契约；随后优先验证 NocoBase 的执行身份/权限扩展与授权边界。若许可或改造边界不接受，再验证 Frappe 的金额/MCP 方案；ObjectStack 需先提供发布一致性及 Action 权限修正方案。Twenty、Corteza、Saltcorn 等保留为候选，不因初筛预算而判定“不支持”。

| 阅读入口 | 内容 |
|---|---|
| [决策建议](DECISION_PROPOSAL.md) / [路线成本](REUSE_OPTIONS.md) | 为什么当前证据不足、各路线工作包、最小补证范围与停止条件 |
| [需求](REQUIREMENTS.md) / [矩阵](FIT_GAP_MATRIX.md) | R01—R22；能力方式与证据级别分别记录，含全部候选的初筛矩阵 |
| [版本登记](CANDIDATE_REGISTER.md) / [检索日志](SEARCH_LOG.md) | 固定完整 SHA、官方上游、版本/分支边界与访问限制 |
| [许可与版本边界](LICENSE_AND_EDITION_REVIEW.md) | 按使用场景评价；LEGAL_REVIEW_REQUIRED 问题 |
| [NocoBase](candidates/nocobase.md) / [Frappe](candidates/frappe.md) / [ObjectStack](candidates/objectstack.md) | A—F 六条链路、扩展边界、源码定位与未知项 |
| [运行记录](RUNTIME_CHECKS.md) / [机器证据索引](EVIDENCE_INDEX.json) | 真实命令、环境、结果/范围、复现脚本、永久源码链接 |
| [执行报告](EXECUTION_REPORT.md) / [批准原文](EXECUTION_PROMPT.md) | 现场保留、Git/PR 交付、完成范围和未验证事项 |

代码管理仓库：[ElioLin/lcp-platform](https://github.com/ElioLin/lcp-platform)。最终审查请求绑定实际 PR 的 Base/Head，放在 PR 正文、最终回复及忽略的 `artifacts/handoff/`；报告不自引用最终 Head。
