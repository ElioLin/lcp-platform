. (Join-Path $PSScriptRoot 'local-environment.ps1')
& (Join-Path $PSScriptRoot 'maven.ps1') -B verify
exit $LASTEXITCODE
