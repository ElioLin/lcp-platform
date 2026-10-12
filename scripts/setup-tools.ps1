#requires -Version 7.0
$ErrorActionPreference='Stop'
$workspaceRoot=Split-Path -Parent $PSScriptRoot
$toolDirectory=Join-Path $workspaceRoot '.local/tools'
New-Item -ItemType Directory -Force -Path $toolDirectory | Out-Null
$nodeVersion=& node --version
if ($LASTEXITCODE -ne 0 -or $nodeVersion -notmatch '^v24\.') { throw 'Node.js 24 is required. This script does not replace global tools.' }
function Download([string]$url,[string]$destination) {
    & curl.exe --silent --show-error --fail --location --connect-timeout 10 --max-time 240 $url -o $destination
    if ($LASTEXITCODE -ne 0) { throw "Download blocked: $url" }
}
$jdkDirectory=Join-Path $toolDirectory 'jdk25/jdk-25.0.4.1+1'
if (-not (Test-Path -LiteralPath (Join-Path $jdkDirectory 'bin/java.exe'))) {
    $jdkArchive=Join-Path $toolDirectory 'jdk25.zip'
    Download 'https://github.com/adoptium/temurin25-binaries/releases/download/jdk-25.0.4.1%2B1/OpenJDK25U-jdk_x64_windows_hotspot_25.0.4.1_1.zip' $jdkArchive
    if ((Get-FileHash -LiteralPath $jdkArchive -Algorithm SHA256).Hash.ToLowerInvariant() -ne '00c847d804f4a78e9f04f2683faf14fed898535b177b7fc704486cb0284e9283') { throw 'JDK checksum mismatch' }
    Expand-Archive -LiteralPath $jdkArchive -DestinationPath (Join-Path $toolDirectory 'jdk25') -Force
}
$mavenDirectory=Join-Path $toolDirectory 'maven/apache-maven-3.9.16'
if (-not (Test-Path -LiteralPath (Join-Path $mavenDirectory 'bin/mvn.cmd'))) {
    $mavenArchive=Join-Path $toolDirectory 'maven.zip'
    $mavenUrl='https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/3.9.16/apache-maven-3.9.16-bin.zip'
    Download $mavenUrl $mavenArchive
    $expected=(Invoke-RestMethod -Uri ($mavenUrl+'.sha512') -TimeoutSec 30).Trim()
    if ((Get-FileHash -LiteralPath $mavenArchive -Algorithm SHA512).Hash.ToLowerInvariant() -ne $expected.ToLowerInvariant()) { throw 'Maven checksum mismatch' }
    Expand-Archive -LiteralPath $mavenArchive -DestinationPath (Join-Path $toolDirectory 'maven') -Force
}
$pnpmEntry=Join-Path $toolDirectory 'pnpm/package/bin/pnpm.mjs'
if (-not (Test-Path -LiteralPath $pnpmEntry)) {
    $package=Invoke-RestMethod -Uri 'https://registry.npmjs.org/pnpm/12.11.2' -TimeoutSec 30
    $pnpmArchive=Join-Path $toolDirectory 'pnpm.tgz'
    Download $package.dist.tarball $pnpmArchive
    $digest=[Convert]::ToBase64String([System.Security.Cryptography.SHA512]::HashData([IO.File]::ReadAllBytes($pnpmArchive)))
    if ('sha512-'+$digest -ne $package.dist.integrity) { throw 'pnpm integrity mismatch' }
    New-Item -ItemType Directory -Force -Path (Join-Path $toolDirectory 'pnpm') | Out-Null
    & tar.exe -xzf $pnpmArchive -C (Join-Path $toolDirectory 'pnpm')
    if ($LASTEXITCODE -ne 0) { throw 'pnpm extraction failed' }
}
Write-Output 'Project-local JDK 25, Maven 3.9.16 and pnpm 12.11.2 are ready. Global tools/settings are unchanged.'
