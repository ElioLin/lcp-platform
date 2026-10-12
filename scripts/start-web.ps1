& (Join-Path $PSScriptRoot 'pnpm.ps1') --dir (Join-Path (Split-Path -Parent $PSScriptRoot) 'web') run dev
exit $LASTEXITCODE
