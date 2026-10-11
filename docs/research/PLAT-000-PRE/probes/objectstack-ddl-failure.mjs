import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
process.env.NODE_ENV='production';process.env.OS_HOME=resolve('restricted-state');process.env.OS_MULTI_ORG_ENABLED='false';
process.env.OS_DATABASE_URL='postgres://pre_restricted@127.0.0.1:55432/lcp_oss_probe';
const result={started_at:new Date().toISOString(),timezone:'Asia/Shanghai',scope:'real PostgreSQL DDL denial; programmatic standalone metadata write; not HTTP auth',version:'17.7.0',source_sha:'4e4e881427a8b8b57696ad5bdb12792f2dac6556',checks:[]};
let kernel,sql;
try{
 const {ObjectKernel,createStandaloneStack}=await import('@objectstack/runtime');const pg=await import('pg');
 sql=new pg.default.Client({connectionString:process.env.OS_DATABASE_URL});await sql.connect();
 const authority=await sql.query("select current_user,has_schema_privilege(current_user,'public','CREATE') as can_create");result.database_authority=authority.rows[0];
 if(authority.rows[0].can_create)throw Error('Probe isolation invalid: role can create tables');
 const stack=await createStandaloneStack({databaseUrl:process.env.OS_DATABASE_URL,databaseDriver:'postgres',projectRoot:process.cwd(),artifactPath:resolve('intentionally-absent-artifact.json'),dev:false,runPlatformMigrations:false,armLifecycleSweep:false});
 kernel=new ObjectKernel({logger:{level:'warn'}});for(const p of stack.plugins)await kernel.use(p);await kernel.bootstrap();
 const protocol=kernel.getService('protocol');
 const obj={name:'pre_ddl_denied',label:'DDL Denied Synthetic Object',sharingModel:'private',fields:{subject:{type:'text',label:'Subject'}}};
 result.publish=await protocol.saveMetaItem({type:'object',name:obj.name,item:obj,mode:'publish'});
 result.tables=(await sql.query("select table_name from information_schema.tables where table_schema='public' and table_name='pre_ddl_denied'")).rows;
 result.metadata=(await sql.query("select name,type,state from sys_metadata where name='pre_ddl_denied'")).rows;
 result.observed_inconsistency=result.publish?.success===true&&result.tables.length===0&&result.metadata.some(r=>r.state==='active');
 console.log(JSON.stringify({publish:result.publish,tables:result.tables,metadata:result.metadata,observed_inconsistency:result.observed_inconsistency}));
}catch(e){result.first_failure={name:e.name,message:e.message,stack:String(e.stack).split('\n').slice(0,7)};console.log(JSON.stringify({status:'BLOCKED',detail:result.first_failure}));process.exitCode=1;}
finally{try{if(kernel)await kernel.shutdown();}catch{}try{if(sql)await sql.end();}catch{}result.finished_at=new Date().toISOString();writeFileSync(resolve('../../../artifacts/oss-assessment/objectstack-ddl-failure-result.json'),JSON.stringify(result,null,2));}
