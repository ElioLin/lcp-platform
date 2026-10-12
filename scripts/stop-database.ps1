param([string]$PostgresBin='D:\PostgreSQL\18\bin')
$ErrorActionPreference='Stop'
$workspaceRoot=Split-Path -Parent $PSScriptRoot
$databaseDirectory=Join-Path $workspaceRoot '.local/data/pg-s1'
& (Join-Path $PostgresBin 'pg_ctl.exe') -D $databaseDirectory -m fast -w stop
exit $LASTEXITCODE
