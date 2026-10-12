# LCP · 领枢业务平台

当前实施阶段：**PLAT-000-S1**。已按用户最新授权收窄为登录、数据库架构、对象管理器、主页列表与单据详情；采用Java/Spring/jOOQ/PostgreSQL、React/TypeScript的自建核心。

入口：[骨架架构与启动说明](docs/architecture/PLAT-000-S1.md)、[验证记录](docs/architecture/VALIDATION-S1.md)。Windows / PowerShell7 / Node24 / PostgreSQL18 环境可执行 `pwsh -File ./scripts/dev.ps1`；页面为 `http://127.0.0.1:5173`，admin/demo密码位于忽略的 `.local/runtime.json`。

本阶段真实实现：数据库账号与会话登录、运行时对象/字段草稿和发布、强类型业务表、动态列表与详情、记录编辑和基础审计。完整权限/Flow/MCP/审批/集成等不计入本次完成范围。骨架完成后按固定提交交 ChatGPT 审查，不自动合并或部署。

## 已保留的研究阶段记录

当前阶段：PLAT-000-PRE 开源底座检索、适配尽调与复用决策。

本仓库仅保存研究与治理记录。PLAT-000 的应用骨架开发已暂停；选型报告不构成采用、改造、合并或部署授权。

批准基线：Java / Spring Boot / jOOQ / PostgreSQL；React / TypeScript；模块化单体、强类型业务对象表。重大变化须另行批准。

研究入口：`docs/research/PLAT-000-PRE/README.md`。
