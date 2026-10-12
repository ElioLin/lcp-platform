$workspaceRoot=Split-Path -Parent $PSScriptRoot
$env:PLAYWRIGHT_BROWSERS_PATH=Join-Path $workspaceRoot '.local/browsers'
& (Join-Path $PSScriptRoot 'pnpm.ps1') --dir (Join-Path $workspaceRoot 'web') run test:e2e
exit $LASTEXITCODE
