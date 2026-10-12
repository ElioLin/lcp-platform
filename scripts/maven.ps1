param([Parameter(ValueFromRemainingArguments=$true)][string[]]$MavenArguments)
$ErrorActionPreference = 'Stop'
$workspaceRoot = Split-Path -Parent $PSScriptRoot
$jdkDirectory = Get-ChildItem -LiteralPath (Join-Path $workspaceRoot '.local/tools/jdk25') -Directory | Select-Object -First 1
if (-not $jdkDirectory) { throw '请先准备项目本地 JDK 25，参见 docs/architecture/PLAT-000-S1.md' }
$env:JAVA_HOME = $jdkDirectory.FullName
$mavenExecutable = Join-Path $workspaceRoot '.local/tools/maven/apache-maven-3.9.16/bin/mvn.cmd'
& $mavenExecutable -s (Join-Path $PSScriptRoot 'maven-settings.xml') "-Dmaven.repo.local=$(Join-Path $workspaceRoot '.local/m2')" -f (Join-Path $workspaceRoot 'backend/pom.xml') @MavenArguments
exit $LASTEXITCODE
