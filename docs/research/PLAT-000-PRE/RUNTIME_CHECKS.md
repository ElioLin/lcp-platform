# 真实运行记录与复现入口

只验证 **ObjectStack 已发行 npm 17.7.0** 的两个问题：①runtime metadata是否能产生typed PG表并追加字段；②DDL被数据库拒绝时metadata发布是否失败/恢复。不是完整平台验收。没有临时补写MCP，没有商业模块/收费模型调用，没有真实业务数据。

## 固定来源与环境

| 项 | 实际值 |
|---|---|
| 审查源码 | objectstack-ai/objectstack `4e4e881427a8b8b57696ad5bdb12792f2dac6556`，17.7.0 package cohort |
| 实际运行 | `@objectstack/runtime@17.7.0`、`@objectstack/core@17.7.0`、`pg@8.16.3`；本次已解析的26个ObjectStack包全部17.7.0 |
| runtime SRI | `sha512-RVyleEk68NXBtdXCFtAarMEbP2JqoG+M9u8GwKERhgyKSfapXSOjfrcBXrAWJDNNXm9r5rrAH6P1Ap1rjUpoeA==` |
| runtime tarball | [官方npm固定包](https://registry.npmjs.org/@objectstack/runtime/-/runtime-17.7.0.tgz) |
| dependency lock SHA256 | `de1243f5a8262c2b0161b38292dafdfae650787d0cf649b0f04708e20d3a640f`，完整lock保留于忽略的试验目录 |
| npm安装 | 399个lock entries（包括root/嵌套依赖）；`--ignore-scripts --no-audit --no-fund`；专属cache/空userconfig；退出0 |
| Source→binary | **UNVERIFIED**：npm package没有gitHead；不能因版本一致宣布编译字节对应审查SHA。源码路径与运行观察独立支持同一行为 |
| OS/Node/PG | Windows x86_64；Node24.13.0；PostgreSQL18.1（msvc-19.44.35221） |
| 数据/监听 | 新建 `lcp_oss_probe`；127.0.0.1:55432，曾观察PID22512；没有API/HTTP listener |
| 装配 | createStandaloneStack：default datasource + Metadata + ObjectQL；无auth/security/job/MCP/UI |
| Docker/镜像 | CLI存在、engine不可用；没有使用镜像，不存在可报告tag/digest |
| 目录 | `.research-cache/experiments/objectstack/`；metadata/state/PGdata/npm cache均在该隔离目录 |

框架源码已有prepare/build等钩子，未在研究clone中运行。registry依赖安装全部关闭lifecycle脚本；选择PG而非native SQLite binding。正式场景不同于standalone embedding，不能从该试验给完整生产host安全通过。

## 场景1：运行时模型与数据

问题预先确定：不生成对象专属代码/不重启，普通object与新增field能否形成真实SQL结构，并通过engine完成合成数据写读。

时间：2026-10-11 **23:50:05.798—23:50:09.116 +08:00**。真实命令为 `node probe.mjs`（cwd在隔离experiment）；最终退出 **0**。脚本：[objectstack-model-probe.mjs](probes/objectstack-model-probe.mjs)。

| 检查 | 观察 | 结论边界 |
|---|---|---|
| protocol.saveMetaItem(publish) | `pre_request`定义保存并注册；返回version/seq/state等 | 程序化入口，不是Metadata HTTP API验证 |
| information_schema | table `pre_request`；subject=text；amount=numeric(65,30) | typed physical table真实，不只metadata声明 |
| ql.insert/find | 1条`synthetic request`；以显式`isSystem:true`测试CRUD | 无两个普通平台用户，不证明R08/R09 |
| 第二次metadata保存 | 添加note:text，实际出现note column | 无对象专属业务代码、无重启 |
| 事后SQL检查 | 原记录1条；note=NULL；amount=`12.340000000000000000000000000000` | 保留/存储事实，不证明所有业务计算或跨对象事务 |

两个准备过程保留日志：第一次harness版本检查正则误把ObjectStack路径下的nested `@better-auth`依赖当ObjectStack包，修正脚本后确认26包全部17.7.0；这不是候选版本失败。第二次定义缺少`sharingModel`被author-time validation拒绝；按源码定义增加`sharingModel:'private'`再运行，没有禁用lint/权限、没有修改候选代码。三个attempt日志均保留，最终通过不是隐去失败或拼接不同candidate版本。

## 场景2：真实DDL拒绝

问题：数据库角色可以写已有metadata表但不能创建新table，publish结果能否正确报告失败并避免active metadata/缺表状态。

新建仅用于试验的PG login role `pre_restricted`，只授schema USAGE、已有tables DML/sequences权限；`has_schema_privilege(...,'CREATE')=false`。这是数据库权限故障注入，**不是第二个认证业务身份**。

时间：2026-10-11 **23:52:12.386—23:52:15.776 +08:00**。真实命令 `node ddl-failure.mjs`；观察脚本退出 **0**，含义是成功取得缺陷观察，**平台发布恢复场景未通过**。脚本：[objectstack-ddl-failure.mjs](probes/objectstack-ddl-failure.mjs)。

```json
{
  "publish": {"success": true, "state": "active", "seq": 3},
  "physical_tables": [],
  "metadata": [{"name": "pre_ddl_denied", "type": "object", "state": "active"}],
  "observed_inconsistency": true
}
```

日志出现对合成对象建表的 `permission denied for schema public`，随后protocol只warn。固定源码 `ensureObjectStorage`捕获异常，以及先repo.put/registry后schema同步的顺序与观察一致。[O-META](https://github.com/objectstack-ai/objectstack/blob/4e4e881427a8b8b57696ad5bdb12792f2dac6556/packages/metadata-protocol/src/protocol.ts#L20460-L20492) [O-DDL-FAIL](https://github.com/objectstack-ai/objectstack/blob/4e4e881427a8b8b57696ad5bdb12792f2dac6556/packages/metadata-protocol/src/protocol.ts#L18932-L18947) [RT-O-DDL](RUNTIME_CHECKS.md)

未测试DDL失败后的客户端HTTP响应、搜索/cache跨进程恢复或原生rollback API；不能把此场景推成所有迁移不可用。本轮没有修复候选。

## 未运行 / 阻塞

| 项 | 状态与原因 |
|---|---|
| ObjectStack两认证用户的record/field/aggregate/export/Action/Flow/MCP | NOT_RUN；此次刻意限定内部kernel/SQL问题，没有挂载生产认证、安全、REST、MCP或UI，不能给PASS |
| 主/明细复合对象、批量/并发/幂等/outbox | NOT_RUN；场景缩小为单对象+追加字段 |
| 两实例metadata导入/依赖/版本回退/退出 | NOT_RUN；故障只覆盖DDL拒绝观察，不覆盖完整迁移治理 |
| ObjectStackPG警告 | OBSERVED / UNVERIFIED：启动/metadata索引迁移有`2BP01 cannot drop index because constraint requires it`等warning；未定位最终根因/支持版本差异，不当无害或全面PG18兼容 |
| Frappe平台 | BLOCKED于未准备本版官方运行环境（Python3.14/Linux/Bench/Redis等）；没有安装或启动，不作功能失败判断 |
| Frappe MCP本版本组合 | SOURCE_TRACED静态冲突；Framework与库的Werkzeug/Pydantic约束不能同时满足。未运行resolver/平台，更未修改依赖掩盖差异 |
| NocoBase平台/商业版 | NOT_RUN；未建立候选完整运行环境；commercial source/授权材料未获取，无收费试用 |
| Docker | BLOCKED：npipe dockerDesktopLinuxEngine不存在；没有启动或修改全局环境 |
| 其它候选 | NOT_RUN；本轮按预算先静态检查，不演示所有平台 |

## 复现与清理（不是自动下一轮授权）

下面记录本轮入口。完整包下载、npm lock、PGdata与巨大日志均忽略，未提交；两个短脚本为本轮自写研究代码，不是候选source复制或应用骨架。复现应使用新空目录、同一版本、独占端口与合成数据，不连接现有业务实例。

1. 从固定Git report Head取得`probes/`脚本；在新的隔离experiment目录创建private package.json，固定runtime/core为17.7.0、pg为8.16.3，并将解析到的全部ObjectStack依赖override到17.7.0。本次68个source package override中实际安装26个。外部依赖的准确resolved/integrity见本机忽略lock；没有该lock时不能声称字节完全可复现。
2. 使用空local npmrc、专属cache，执行 `npm.cmd install --ignore-scripts --no-audit --no-fund`；不执行source仓库prepare/install hooks、不覆盖全局工具。
3. 本轮PG命令（路径/端口/data目录当时已核查）：

```powershell
& 'D:\PostgreSQL\18\bin\initdb.exe' -D '<new isolated pgdata>' -U lcp_research -A trust --encoding=UTF8 --locale=C
& 'D:\PostgreSQL\18\bin\pg_ctl.exe' -D '<new isolated pgdata>' -l '<isolated log>' -o '-h 127.0.0.1 -p 55432 -F' -w start
& 'D:\PostgreSQL\18\bin\psql.exe' -h 127.0.0.1 -p 55432 -U lcp_research -d postgres -v ON_ERROR_STOP=1 -c 'CREATE DATABASE lcp_oss_probe'
```

4. 复制自写model脚本到`.research-cache/experiments/objectstack/probe.mjs`，在该cwd执行；完成后，只在此专用数据库建立受限role：

```sql
CREATE ROLE pre_restricted LOGIN;
GRANT USAGE ON SCHEMA public TO pre_restricted;
GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO pre_restricted;
GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA public TO pre_restricted;
```

5. 执行同cwd的ddl-failure脚本，保存JSON和log，最后 `pg_ctl -D '<same isolated pgdata>' -m fast -w stop`。本轮这条stop命令退出0，之后55432没有listener。保留PGdata、两角色和合成数据在已停止的孤立cluster，不删除任何既有文件。

具体logs：`artifacts/oss-assessment/objectstack-npm-install.log`、`objectstack-probe.log`、`objectstack-probe-attempt2.log`、`objectstack-probe-attempt3.log`、`objectstack-ddl-failure.log`、`objectstack-postcheck.txt`、结果JSON。均为本地忽略证据，不给不存在的远程URL；报告提供了脱敏摘要与复现代码。
