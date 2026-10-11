# 决策建议

**DESIGN_DECISION：INSUFFICIENT_EVIDENCE。** 当前没有足以承担采用/长期维护责任的首选平台，亦没有证明应立即自建。研究完成并交付报告；路线与任何开发都未获采用批准。

这不是“无法检索”。公开GitHub/官方文档/固定源码/npm/PyPI访问成功，三条主要平台的动态建模实现已追踪，ObjectStack的两个PG场景真实执行。不足之处是关键商业/授权材料未获取、Frappe正式环境未建立，以及同用户跨执行面权限、金融语义、配置恢复与退出等缺口尚无可承担的补齐边界。

## 支持结论的决定性证据

1. **对象机制并非主要空白**：NocoBase collections、Frappe custom DocType和ObjectStack protocol均有真实runtime路径，ObjectStack已运行动态typed table/add-field。不能将它们当普通生成器而据此确认Java自研。[N-DDL](https://github.com/nocobase/nocobase/blob/3b7958ce95ebd2a5467fa0de991f627d1820dfc4/packages/plugins/%40nocobase/plugin-data-source-main/src/server/models/collection.ts#L199-L245) [F-CUSTOM](https://github.com/frappe/frappe/blob/2871914b69b6e14a4b023d9b7cc52dc3e269cc1b/frappe/core/doctype/doctype/doctype.py#L328-L344) [F-MODEL](https://github.com/frappe/frappe/blob/2871914b69b6e14a4b023d9b7cc52dc3e269cc1b/frappe/core/doctype/doctype/doctype.py#L532-L578) [RT-O-DYNAMIC](RUNTIME_CHECKS.md)
2. **配置一致性仍是采用门槛**：ObjectStack保存active metadata后捕获DDL异常；真实受限PG角色发布返回success、却没有表。需要一致性/恢复方案，不能通过首页启动、换日志文字或备份存在来给通过。[O-DDL-FAIL](https://github.com/objectstack-ai/objectstack/blob/4e4e881427a8b8b57696ad5bdb12792f2dac6556/packages/metadata-protocol/src/protocol.ts#L18932-L18947) [RT-O-DDL](RUNTIME_CHECKS.md)
3. **权限传递不能跳步**：NocoBase Flow直接repository，Frappe自动化默认Admin且可信代码有get_all/ignore路径，ObjectStacktrusted Action提权。都存在可扩展抽象，但“token透传”不足以证明R07/R09。[N-FLOW-CREATE](https://github.com/nocobase/nocobase/blob/3b7958ce95ebd2a5467fa0de991f627d1820dfc4/packages/plugins/%40nocobase/plugin-workflow/src/server/instructions/CreateInstruction.ts#L36-L69) [F-FLOW-DEFAULT](https://github.com/frappe/frappe/blob/2871914b69b6e14a4b023d9b7cc52dc3e269cc1b/frappe/automation/doctype/automation_flow/automation_flow.py#L128-L134) [F-GETALL](https://github.com/frappe/frappe/blob/2871914b69b6e14a4b023d9b7cc52dc3e269cc1b/frappe/__init__.py#L1386-L1408) [O-ACTION](https://github.com/objectstack-ai/objectstack/blob/4e4e881427a8b8b57696ad5bdb12792f2dac6556/packages/runtime/src/domains/actions.ts#L358-L395)
4. **精度与正式组件组合有新成本**：FrappePG numeric→float；官方MCP当前源码/PyPI版本与Framework16.51.1的Werkzeug/Pydantic要求冲突，自动metadata工具也未现成实现。不得拼接“稳定Framework +最新MCP宣传 +数据库decimal”当完整通过。[F-DECIMAL](https://github.com/frappe/frappe/blob/2871914b69b6e14a4b023d9b7cc52dc3e269cc1b/frappe/database/postgres/database.py#L32-L39) [F-CAST](https://github.com/frappe/frappe/blob/2871914b69b6e14a4b023d9b7cc52dc3e269cc1b/frappe/model/base_document.py#L545-L561) [F-PY](https://github.com/frappe/frappe/blob/2871914b69b6e14a4b023d9b7cc52dc3e269cc1b/pyproject.toml#L5-L85) [FM-DEPS](https://github.com/frappe/mcp/blob/11d5076b1bf4483b2ff6751a13e0736f5396b1e6/pyproject.toml#L13-L22) [FM-PYPI](https://pypi.org/pypi/frappe-mcp/json)
5. **授权是独立门槛**：NocoBase补充许可与商业插件、Steedos分代/目录、Nop声明冲突、Jeecg模块竞争限制、Directus当前MSCL及Jmix/Twenty premium都需分别核定。支付与OEM/平台权利不是同一件事。[N-LICENSE](https://github.com/nocobase/nocobase/blob/3b7958ce95ebd2a5467fa0de991f627d1820dfc4/LICENSE.txt#L49-L101) [S-DEFAULT-LIC](https://github.com/steedos/steedos-platform/blob/db942fdddbdb34644fb470f015bd0f351ec0ca92/LICENSE.txt#L1-L20) [P-README-LIC](https://github.com/entropy-cloud/nop-entropy/blob/b06ee33095bb302e4305ea8c308703ef99528d2d/README.md#L283-L301) [E-FRONT-LIC](https://github.com/jeecgboot/JeecgBoot/blob/e3b9dc0aefe1943d9772b026f64ed671a7c82802/jeecgboot-vue3/LICENSE#L1-L34) [D-LICENSE](https://github.com/directus/directus/blob/4f77933bf9551cac6b289576078783e189b8f4e3/license#L1-L118) [DOC-J-DYNAMIC](https://docs.jmix.io/jmix/dyn-model/index.html)

## 首选与备选的准确含义

**正式采用首选：未选定。** **优先补证候选：NocoBase2.2.23**。它的runtime SQL/资源/ACL、ReactUI/插件基础最直接对应内部业务应用；但Flow身份/授权范围和Professional+模块成本未过关，不因这个优先级自动采购或采用。

**主要技术备选：Frappe16.51.1**，MIT及已有DocType/Document/Automation抽象有较大复用价值；金额契约、MCP可用组合、Python/Desk换栈必须先明确。**架构高度相关备选：ObjectStack17.7.0**，metadata/MCP/typed SQL/Apache契约接近目标，但实测发布恢复缺口和Action策略必须先解决。

Twenty2.45.0、Corteza2024.9.10、Saltcorn1.6.2等保持保留候选，初筛未知不是淘汰。不把只深读3个项目得出的不足夸大为全球不存在合适平台。

## 最小补证，不无限研究

| 顺序 | 范围 | 必须得到的结果/停止条件 |
|---|---|---|
| 1 | 用户/权利人材料；本轮不自动联系 | 明确同法人/集团/客户/OEM与品牌，是否接受商业模块/费用；NocoBase条款/模块授权与stop-subscription边界需可核定。权利不明确则停止该采用路径 |
| 2 | 只对NocoBase或Frappe之一做正确host双用户场景，另行受限Prompt | 配置普通主/明细与金额；两个非admin，API/aggregate/export/Action/Flow/MCP正反例；拒绝客户端actor、自报role与撤权后执行；写出真正extension边界/必要patch |
| 3 | 同一候选配置迁移与故障恢复、出口小样 | 不覆盖业务数据的依赖包迁移；DDL/索引失败、恢复，permission/cache同步；导出metadata/data/附件关系/流程history；不能只启动container |
| 4 | ObjectStack仅在有明确修复方案时 | 对当前DDL错误与Action权限方案做上游固定版本/受限patch评估，标明是否深fork；本轮不开发修复或对上游写入 |

Frappe若被选入下一验证，需要合法可用的Linux/容器/完整Python3.14环境，固定MCP兼容组合，以及金额范围/舍入或精确Decimal要求；缺项不能凭默认值通过。只在前三优先候选门槛无法接受且有新证据时，扩展深读Twenty/Corteza/Saltcorn。

## 技术栈与批准事项

现在仍使用批准基线，没有换Java/React/PG/jOOQ，也没有应用代码。可讨论的重大变化及收益/损失见 [ADR](ADR-0001-STACK-OPTIONS.md)，状态仅为PROPOSED。接受Node/TS或Python不是本轮默认动作；保留React却重写Frappe前端的额外成本不能隐去。

审查后可进入“采用方案/受限补证讨论”，或者在充分证据下讨论恢复“自建骨架”。本报告不授权任何下一模块。最终审查必须绑定本轮实际PR与固定报告Head，不能审查“最新分支”。
