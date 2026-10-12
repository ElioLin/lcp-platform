param([string]$PostgresBin='D:\PostgreSQL\18\bin')
. (Join-Path $PSScriptRoot 'local-environment.ps1')
$databaseDirectory = Join-Path $workspaceRoot '.local/data/pg-s1'
$databaseLog = Join-Path $workspaceRoot '.local/data/pg-s1.log'
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $databaseDirectory) | Out-Null
if (-not (Test-Path -LiteralPath (Join-Path $databaseDirectory 'PG_VERSION'))) {
    $passwordFile = Join-Path $workspaceRoot '.local/data/pg-init-password.txt'
    $localSettings.databasePassword | Set-Content -LiteralPath $passwordFile -Encoding UTF8 -NoNewline
    & (Join-Path $PostgresBin 'initdb.exe') -D $databaseDirectory -U $localSettings.databaseUser -A scram-sha-256 --encoding=UTF8 --locale=C --pwfile=$passwordFile
    if ($LASTEXITCODE -ne 0) { throw 'Failed to initialize isolated PostgreSQL cluster' }
}
& (Join-Path $PostgresBin 'pg_ctl.exe') -D $databaseDirectory status *> $null
if ($LASTEXITCODE -ne 0) {
    $startArguments = @('-D',"`"$databaseDirectory`"",'-l',"`"$databaseLog`"",'-o',"`"-h 127.0.0.1 -p $($localSettings.databasePort) -c timezone=UTC`"",'-w','start')
    $databaseStarter = Start-Process -FilePath (Join-Path $PostgresBin 'pg_ctl.exe') -ArgumentList $startArguments -WindowStyle Hidden -Wait -PassThru -RedirectStandardOutput (Join-Path $workspaceRoot '.local/data/pg-start.log') -RedirectStandardError (Join-Path $workspaceRoot '.local/data/pg-start-error.log')
    if ($databaseStarter.ExitCode -ne 0) { throw 'Failed to start isolated database; port may be occupied' }
}
$env:PGPASSWORD = $localSettings.databasePassword
foreach ($databaseName in @($localSettings.databaseName,$localSettings.testDatabaseName)) {
    if ($databaseName -notmatch '^lcp_s1_(dev|test)$') { throw 'Unexpected database name' }
    $exists = & (Join-Path $PostgresBin 'psql.exe') -h 127.0.0.1 -p $localSettings.databasePort -U $localSettings.databaseUser -d postgres -At -v ON_ERROR_STOP=1 -c "select 1 from pg_database where datname='$databaseName'"
    if ($LASTEXITCODE -ne 0) { throw 'Database connection failed' }
    if ($exists -ne '1') {
        & (Join-Path $PostgresBin 'createdb.exe') -h 127.0.0.1 -p $localSettings.databasePort -U $localSettings.databaseUser $databaseName
        if ($LASTEXITCODE -ne 0) { throw 'Creating isolated database failed' }
    }
}
Write-Output 'LCP development/test databases ready on 127.0.0.1:55433. Existing PostgreSQL services are untouched.'
