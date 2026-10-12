param([string]$PostgresBin='D:\PostgreSQL\18\bin')
$ErrorActionPreference='Stop'
& (Join-Path $PSScriptRoot 'setup-tools.ps1')
& (Join-Path $PSScriptRoot 'start-database.ps1') -PostgresBin $PostgresBin
& (Join-Path $PSScriptRoot 'pnpm.ps1') --dir (Join-Path (Split-Path -Parent $PSScriptRoot) 'web') install --frozen-lockfile --ignore-scripts
if ($LASTEXITCODE -ne 0) { throw 'Web dependency installation failed' }
& (Join-Path $PSScriptRoot 'preview.ps1')
