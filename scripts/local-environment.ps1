$ErrorActionPreference = 'Stop'
$workspaceRoot = Split-Path -Parent $PSScriptRoot
$localDirectory = Join-Path $workspaceRoot '.local'
New-Item -ItemType Directory -Force -Path $localDirectory | Out-Null
$settingsFile = Join-Path $localDirectory 'runtime.json'
if (-not (Test-Path -LiteralPath $settingsFile)) {
    function New-LocalSecret { [Convert]::ToHexString([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(24)) }
    @{ databasePassword=(New-LocalSecret); adminPassword=(New-LocalSecret); demoPassword=(New-LocalSecret); databaseUser='lcp_s1'; databasePort=55433; databaseName='lcp_s1_dev'; testDatabaseName='lcp_s1_test' } |
        ConvertTo-Json | Set-Content -LiteralPath $settingsFile -Encoding UTF8
}
$localSettings = Get-Content -LiteralPath $settingsFile -Raw | ConvertFrom-Json
$env:LCP_DB_URL = "jdbc:postgresql://127.0.0.1:$($localSettings.databasePort)/$($localSettings.databaseName)"
$env:LCP_TEST_DB_URL = "jdbc:postgresql://127.0.0.1:$($localSettings.databasePort)/$($localSettings.testDatabaseName)"
$env:LCP_DB_USER = $localSettings.databaseUser
$env:LCP_DB_PASSWORD = $localSettings.databasePassword
$env:LCP_BOOTSTRAP_ADMIN_PASSWORD = $localSettings.adminPassword
$env:LCP_BOOTSTRAP_DEMO_PASSWORD = $localSettings.demoPassword
$env:LCP_SEED_EXAMPLE = 'true'
