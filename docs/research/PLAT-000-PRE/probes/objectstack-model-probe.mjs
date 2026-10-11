import {writeFileSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
process.env.NODE_ENV='production';
process.env.OS_HOME=resolve('state');
process.env.OS_MULTI_ORG_ENABLED='false';
process.env.OS_DATABASE_URL='postgres://lcp_research@127.0.0.1:55432/lcp_oss_probe';
const result={started_at:new Date().toISOString(),timezone:'Asia/Shanghai',scope:'programmatic standalone kernel / PostgreSQL only; no HTTP identity or permissions claim',source_sha:'4e4e881427a8b8b57696ad5bdb12792f2dac6556',package_version:'17.7.0',package_source_equivalence:'UNVERIFIED: npm registry has no gitHead',checks:[]};
const output=resolve('../../../artifacts/oss-assessment/objectstack-probe-result-attempt3.json');
const record=(name,status,detail)=>{result.checks.push({name,status,detail});console.log(JSON.stringify({name,status,detail}));};
const watchdog=setTimeout(()=>{record('execution','BLOCKED','120-second probe budget exceeded');result.finished_at=new Date().toISOString();writeFileSync(output,JSON.stringify(result,null,2));process.exit(124);},120000);
let kernel,sql;
try{
 const lock=JSON.parse(readFileSync('package-lock.json','utf8'));
 const versions=[...new Set(Object.entries(lock.packages).filter(([p])=>/(?:^|\/)node_modules\/@objectstack\/[^/]+$/.test(p)).map(([,p])=>p.version))];
 result.objectstack_versions=versions;
 result.lock_sha256=createHash('sha256').update(readFileSync('package-lock.json')).digest('hex');
 if(versions.some(v=>v!=='17.7.0'))throw Error('Mixed ObjectStack versions refused');
 const {ObjectKernel,createStandaloneStack}=await import('@objectstack/runtime');
 const pg=await import('pg');sql=new pg.default.Client({connectionString:process.env.OS_DATABASE_URL});await sql.connect();
 const db=await sql.query('select version()');result.database=db.rows[0].version;
 const stack=await createStandaloneStack({databaseUrl:process.env.OS_DATABASE_URL,databaseDriver:'postgres',projectRoot:process.cwd(),artifactPath:resolve('intentionally-absent-artifact.json'),dev:false,armLifecycleSweep:false});
 kernel=new ObjectKernel({logger:{level:'warn'}});
 for(const plugin of stack.plugins)await kernel.use(plugin);
 await kernel.bootstrap();record('kernel_boot','PASS',{plugins:stack.plugins.map(p=>p.name)});
 const protocol=kernel.getService('protocol');const ql=kernel.getService('objectql');
 const obj={name:'pre_request',label:'Research Request',sharingModel:'private',fields:{subject:{type:'text',label:'Subject',required:true},amount:{type:'currency',label:'Amount'}}};
 const saved=await protocol.saveMetaItem({type:'object',name:obj.name,item:obj,mode:'publish'});
 record('metadata_publish_returned','PASS',{return_keys:Object.keys(saved??{})});
 const tables=await sql.query("select table_name from information_schema.tables where table_schema='public' and table_name like '%pre_request%'");
 record('physical_table',tables.rows.length?'PASS':'FAIL',tables.rows);
 if(!tables.rows.length)throw Error('Published object has no physical table');
 const tableName=tables.rows[0].table_name;
 const cols=await sql.query('select column_name,data_type,numeric_precision,numeric_scale from information_schema.columns where table_schema=$1 and table_name=$2',['public',tableName]);
 record('physical_types','OBSERVED',cols.rows);
 const row=await ql.insert(obj.name,{subject:'synthetic request',amount:'12.34'},{context:{isSystem:true}});
 const rows=await ql.find(obj.name,{context:{isSystem:true}});
 record('data_crud_programmatic','PASS',{insert_id:row?.id,record_count:rows.length});
 const updated={...obj,fields:{...obj.fields,note:{type:'text',label:'Note'}}};
 await protocol.saveMetaItem({type:'object',name:obj.name,item:updated,mode:'publish'});
 const newcols=await sql.query('select column_name from information_schema.columns where table_schema=$1 and table_name=$2 and column_name=$3',['public',tableName,'note']);
 record('runtime_add_field',newcols.rows.length?'PASS':'FAIL',newcols.rows);
 record('identities_permissions_mcp_config_migration','NOT_RUN','This probe does not mount auth, security, REST, MCP or UI; it is not platform acceptance');
}catch(e){result.first_failure={name:e.name,message:e.message,stack:String(e.stack).split('\n').slice(0,8)};record('probe','BLOCKED',result.first_failure);process.exitCode=1;}
finally{
 try{if(kernel)await kernel.shutdown();}catch(e){record('kernel_shutdown','ERROR',e.message);}
 try{if(sql)await sql.end();}catch{}
 clearTimeout(watchdog);result.finished_at=new Date().toISOString();writeFileSync(output,JSON.stringify(result,null,2));
}
