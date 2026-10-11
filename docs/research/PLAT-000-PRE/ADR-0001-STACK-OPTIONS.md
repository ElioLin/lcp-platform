# ADR-0001 · 复用候选的技术栈变化（待批准）

状态：**PROPOSED / 未批准、未执行**。日期：2026-10-12，Asia/Shanghai。关联：PLAT-000-PRE；当前路线INSUFFICIENT_EVIDENCE。

## 现状与决定

批准基线仍为Java/Spring Boot/jOOQ/PostgreSQL、React/TypeScript、模块化单体与强类型对象表。目录仅研究记录；试验中的Node/npm/PG均在隔离目录、合成数据，不构成产品技术选型。

本轮**不建议现在执行技术栈变更**。若未来达到整平台复用门槛，用户可批准下表中的某个完整变化方案，不能一边称“原版复用”一边暗中改写平台为Java。

| 待批准方案 | 变化 | 已见收益 | 风险/需补证 |
|---|---|---|---|
| NocoBase + LCP plugins | 服务端换Node/TS/Koa/Sequelize；Spring/jOOQ不作同一运行内核；React/TS、PG方向可保持 | runtime collections、data resources、ACL、plugin/工作流/动态UI基础 | 授权/Professional+模块，Flow真实actor、数据库version和schema发布/退出；代码/权限不能分散到两套内核 |
| Frappe + LCP app | 服务端换Python3.14/DocType/Document/Bench；主要工作台采用Desk JS/jQuery/Vue，React仅明确的外围应用；PG adapter待本版验证 | Custom DocType/DDL/自动API、Document权限、Form/Grid、queues/Automation可省建设 | float精度或Decimal改造、MCP冲突、Linux/Redis/worker运维、metadata迁移；完全保留React渲染意味着多做动态UI |
| ObjectStack + LCP metadata/plugins | 服务端Node/TS/ObjectQL/Knex；React/TS与PG方向保持；采用固定cohort/artifact协议 | Apache framework，typed metadata与本次PG动态建模已见证据，MCP桥接抽象 | 发布一致性已复现缺口；trusted script提权、正确host、协议/Console/cohort升级与出口 |
| 继续Java核心路线 | 技术栈无重大变化；具体库版本另行确认 | 契约可直接对齐，既有语言路线沿用 | 没有现成LCP内核；DDL/权限/MCP/Flow/渲染/恢复等仍需设计建设，不宣称便宜或天然安全 |

## 需单独批准的需求偏差

金额是否允许受控float范围及强舍入，还是必须全链路十进制；Action是否可以明确能力授权后系统提权，还是始终按调用用户数据权限；对象采用JSON/EAV还是专用typed表；配置发布停机/在线、跨实例升级与失败恢复策略。这些不是筛选便利条件，不能默默降低。

最终采用Prompt必须列所选版本/SHA、模块授权、工作包、生产环境及验收，不由本ADR触发任何文件导入、应用骨架、购买、合并或部署。
