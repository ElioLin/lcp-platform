# 检索、获取与停止边界

时间：2026-10-11 23:25 起至 2026-10-12，Asia/Shanghai。API 原始获取时间（UTC）及 `access_timezone` 保存在证据索引。仓库默认分支持续变化，所有源码结论绑定已取得的完整 SHA。

## 实际查询

以下是本轮实际使用的查询词/入口，按方向汇总；不按结果的 Stars 或热度排序。

| 方向 | 实际查询词（公开搜索工具） | 追踪到的权威来源 |
|---|---|---|
| 元数据/Salesforce 替代 | `metadata driven low code platform Salesforce alternative runtime schema open source Steedos ObjectStack NocoBase` | Steedos 官方仓库、docs.steedos.com、ObjectStack 官网/仓库 |
| Java/dynamic entities | `runtime dynamic entities Axelor Jmix Nop JeecgBoot open source official documentation` | Axelor 8.2 模型文档、Jmix v3 Dynamic Model、Nop/Jeecg 官方仓库 |
| headless/API/MCP | `open source headless business platform metadata API MCP actions Frappe Corteza Directus Twenty` | Twenty 元数据 API、Directus 官方 MCP/许可、Frappe/Corteza |
| 中文元数据 | `开源 元数据驱动 业务平台 运行时 动态对象 字段 API Nop Jeecg` | 固定版本 Nop nocode/ORM 文档与 Jeecg 源码 |
| MCP 业务 Action | `MCP business actions metadata platform open source ObjectStack permissions workflow` | ObjectStack Action/MCP/authorization 文档与源码 |
| NocoBase 权利/版本 | `site.nocobase.com license Apache commercial production license community workflow approval migration`；`site.docs.nocobase.com migration management approval commercial plugin` | 当前 agreement、2.0 调整公告、插件版次页；最终许可判断以固定源码为准 |
| Frappe DocType | `site.docs.frappe.io framework custom doctype PostgreSQL permissions api workflow` | Framework 文档及固定 SHA 的 DocType/数据库/权限源码 |
| Frappe MCP | `site.docs.frappe.io framework MCP server native automation actions` | 官方组织 frappe/mcp；另查询 PyPI frappe-mcp，不冒充 Framework 内置模块 |
| 相关非种子 | `site.saltcorn.com open source PostgreSQL dynamic table permissions plugins` | Saltcorn 官网、wiki、官方仓库与 npm；补充 Directus/Twenty |
| 版本/上游 | `site.jeecg.com GitHub JeecgBoot 官方 开源 在线表单 许可证`；`site.objectstack.ai github objectstack-ai open source licensing ObjectQL ObjectOS` | 官网→GitHub 关联核查；镜像不作为独立候选 |
| 模型偏差 | `site.docs.axelor.com adk 8.2 custom models json model studio`；`site.docs.cortezaproject.org 2024.9 data access layer plain encoding module table` | Axelor MetaJsonRecord；Corteza DAL 默认 JSON 与 Plain/alias 扩展 |
| 法律核对 | `site.gnu.org licenses GPL FAQ AGPL internal organization network users modified version` | FSF 官方许可/FAQ；许可证本体仍逐个读取 |

部分搜索结果是论坛、聚合站、百科或宣传页，仅用作发现入口，没有用来证明版本能力、许可证或成本。技术判断引用官方源码/文档；报价不作为已核定采购成本。

## GitHub 与来源固定

对 12 个平台仓库分别读取 GitHub repository、前 10 条 Releases、3 条 closed issues/PR 样本、最多 5 条公开 security advisories；使用 `git ls-remote` 核对默认 HEAD 与所选 tag 的解引用提交。相关 API snapshot 是忽略的本地证据，提交索引保留必要摘要与 URL。没有执行未经认证的 GitHub 全站代码搜索；固定源码在本地用 `rg` 检索。

采用 GitHub 自动生成的固定 SHA tarball，只在 `.research-cache/sources/` 解包。NocoBase 解包超时留下部分工作副本；所引用文件均实际可读、行范围及 hash 已核对，不声称整包已完整解压。Nop/Twenty 整包下载超时，改用 GitHub 固定 SHA 的完整 tree 与 raw 文件取得决定性材料。猜测路径出现的 404 已通过 tree 定位纠正；404 不作为“不支持”证据。没有 clone/fork 到产品目录。

Steedos 默认分支 3.0 与正式 2.7.32 分别取证；ObjectStack 独立权威仓库通过官方网站确认；Saltcorn npm 稳定版 1.6.2/tag 与默认 beta snapshot 分开读取。Frappe MCP 是发现原生 MCP 线索后唯一新增的附属源码检查，未将它算作第 13 个平台候选。

## 访问条件与限制

- Git、公开 API、HTTPS ls-remote、raw、codeload、官方网页、npm/PyPI 可访问。发生过大文件下载/解包超时，决定性材料已取得，不据此否定候选。
- `gh` 未安装。用户后来指定 `ElioLin/lcp-platform`；通过该授权远端的现有 Git credential helper，在内存中核验账号与权限并使用 Git/GitHub REST 交付报告。没有把 token 写入文件或输出，不改全局代理/TLS/凭证配置。
- Docker CLI 有，Docker engine 未运行；没有启动 Desktop、修改服务或启用 WSL。只使用现有 PostgreSQL 18.1 二进制创建专用合成数据实例，试验后停止。
- NocoBase 商业审批/迁移、Jmix Dynamic Model、Axelor 商业 Studio 等没有取得源码、安装包或试用权。`OFFICIAL_COMMERCIAL / DOC_ONLY` 不能记为 `SOURCE_TRACED`。
- Frappe 的官方部署环境与 Python 3.14 工具链未在本轮建立，没有做 Frappe 平台运行试验。缺环境不是候选功能失败。
- issue closure 不等于已修复；安全公告仅是有界样本，无公告不等于安全。未查尽依赖 CVE、全部许可或整个项目的测试质量。

## 停止规则与实际深度

预算按任务建议控制在 12 个平台仓库入口，3 个平台深读，1 个平台的 2 个决定性运行场景。优先深读运行时模型与 API/业务包抽象最接近目标的 NocoBase、Frappe、ObjectStack；Java 候选同样读取了模型机制/模块许可，不以语言淘汰。

Directus、Twenty、Saltcorn 是主动补充；Corteza/这些候选的未深读功能保持 UNKNOWN。没有为凑候选数加入后台模板或通用自动化工具。没有把有限范围写成全球不存在合适项目，也没有用本轮未做完整验收推定所有候选不可用。
