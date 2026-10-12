param([switch]$SkipBuild)
. (Join-Path $PSScriptRoot 'local-environment.ps1')
$logDirectory=Join-Path $workspaceRoot '.local/logs'
New-Item -ItemType Directory -Force -Path $logDirectory | Out-Null
if (-not $SkipBuild) {
    & (Join-Path $PSScriptRoot 'maven.ps1') -B -DskipTests package
    if ($LASTEXITCODE -ne 0) { throw 'Backend build failed' }
    & (Join-Path $PSScriptRoot 'pnpm.ps1') --dir (Join-Path $workspaceRoot 'web') run build
    if ($LASTEXITCODE -ne 0) { throw 'Web build failed' }
}
function Owned-Listener([int]$port) {
    $listener=Get-NetTCPConnection -LocalAddress 127.0.0.1 -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $listener) { return $null }
    $processInfo=Get-CimInstance Win32_Process -Filter "ProcessId=$($listener.OwningProcess)"
    if ($processInfo.CommandLine -notmatch ([regex]::Escape($workspaceRoot)+'[\\/]')) { throw "Port $port belongs to another process; it will not be stopped or overwritten" }
    return $listener.OwningProcess
}
$backendProcessId=Owned-Listener 8085
if (-not $backendProcessId) {
    $jdkDirectory=Get-ChildItem -LiteralPath (Join-Path $workspaceRoot '.local/tools/jdk25') -Directory | Select-Object -First 1
    $jarFile=Join-Path $workspaceRoot 'backend/target/lcp-platform-0.1.0-SNAPSHOT.jar'
    $backend=Start-Process -FilePath (Join-Path $jdkDirectory.FullName 'bin/java.exe') -ArgumentList @('-jar',"`"$jarFile`"") -WorkingDirectory $workspaceRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $logDirectory 'backend.log') -RedirectStandardError (Join-Path $logDirectory 'backend-error.log')
    $backendProcessId=$backend.Id
}
$frontendProcessId=Owned-Listener 5173
$frontendLauncherId=$null
if (-not $frontendProcessId) {
    $env:NPM_CONFIG_USERCONFIG=Join-Path $PSScriptRoot 'empty.npmrc'
    $env:NPM_CONFIG_STORE_DIR=Join-Path $workspaceRoot '.local/pnpm-store'
    $env:NPM_CONFIG_IGNORE_SCRIPTS='true'
    $pnpmEntry=Join-Path $workspaceRoot '.local/tools/pnpm/package/bin/pnpm.mjs'
    $webDirectory=Join-Path $workspaceRoot 'web'
    $frontend=Start-Process -FilePath (Get-Command node.exe).Source -ArgumentList @("`"$pnpmEntry`"",'--dir',"`"$webDirectory`"",'run','preview') -WorkingDirectory $workspaceRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $logDirectory 'web.log') -RedirectStandardError (Join-Path $logDirectory 'web-error.log')
    $frontendLauncherId=$frontend.Id
}
$deadline=[DateTime]::UtcNow.AddSeconds(120)
while ([DateTime]::UtcNow -lt $deadline) {
    try {
        $health=Invoke-RestMethod -Uri 'http://127.0.0.1:8085/api/health' -TimeoutSec 2
        $webResponse=Invoke-WebRequest -Uri 'http://127.0.0.1:5173' -TimeoutSec 2
        if ($health.status -eq 'UP' -and $webResponse.StatusCode -eq 200) { break }
    } catch { Start-Sleep -Milliseconds 500 }
}
$frontendProcessId=Owned-Listener 5173
if (-not $frontendProcessId -or $health.status -ne 'UP') { throw 'Preview did not become ready; inspect .local/logs' }
@{ backend=$backendProcessId; frontend=$frontendProcessId; frontendLauncher=$frontendLauncherId } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $workspaceRoot '.local/preview-processes.json') -Encoding UTF8
Write-Output 'LCP preview ready: http://127.0.0.1:5173 . Accounts: admin / demo. Passwords: .local/runtime.json (ignored).'
