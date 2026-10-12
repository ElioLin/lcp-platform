$ErrorActionPreference='Stop'
$workspaceRoot=Split-Path -Parent $PSScriptRoot
$stateFile=Join-Path $workspaceRoot '.local/preview-processes.json'
if (-not (Test-Path -LiteralPath $stateFile)) { throw 'No recorded LCP preview process' }
$previewProcesses=Get-Content -LiteralPath $stateFile -Raw | ConvertFrom-Json
foreach ($processId in @($previewProcesses.backend,$previewProcesses.frontend,$previewProcesses.frontendLauncher)) {
    if (-not $processId) { continue }
    $processInfo=Get-CimInstance Win32_Process -Filter "ProcessId=$processId" -ErrorAction SilentlyContinue
    if (-not $processInfo) { continue }
    if ($processInfo.CommandLine -notmatch ([regex]::Escape($workspaceRoot)+'[\\/]')) { throw "Recorded PID $processId no longer belongs to LCP; stopping refused" }
    Stop-Process -Id $processId
}
Write-Output 'LCP API/web preview stopped. Database remains available; use scripts/stop-database.ps1 to stop the dedicated cluster.'
