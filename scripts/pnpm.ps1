param([Parameter(ValueFromRemainingArguments=$true)][string[]]$PnpmArguments)
$workspaceRoot=Split-Path -Parent $PSScriptRoot
$env:NPM_CONFIG_USERCONFIG=Join-Path $PSScriptRoot 'empty.npmrc'
$env:NPM_CONFIG_STORE_DIR=Join-Path $workspaceRoot '.local/pnpm-store'
$env:NPM_CONFIG_IGNORE_SCRIPTS='true'
& node (Join-Path $workspaceRoot '.local/tools/pnpm/package/bin/pnpm.mjs') @PnpmArguments
exit $LASTEXITCODE
