param([switch]$PrepareOnly, [switch]$UsePackagedJar)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

if ($env:OS -ne 'Windows_NT' -or -not [Environment]::Is64BitProcess) {
    throw 'This script requires 64-bit Windows PowerShell or PowerShell on Windows.'
}

$projectDirectory = Split-Path -Parent $PSScriptRoot
[xml]$projectPom = Get-Content -LiteralPath (Join-Path $projectDirectory 'pom.xml') -Raw
$jdbcVersion = $projectPom.project.properties.'mssql-jdbc.version'
if ($jdbcVersion -ne '13.4.0.jre11') {
    throw 'Update the native DLL version and checksum in this script to match mssql-jdbc.version.'
}

$nativeDirectory = Join-Path $projectDirectory '.local\native'
$nativeFileName = 'mssql-jdbc_auth-13.4.0.x64.dll'
$nativeFilePath = Join-Path $nativeDirectory $nativeFileName
$downloadUrl = 'https://repo.maven.apache.org/maven2/com/microsoft/sqlserver/mssql-jdbc_auth/13.4.0.x64/' + $nativeFileName
$expectedSha256 = '759d0d189b5a8d1ae21a32b10c1d2ffd476c22476ff0705ce758d8e4be860c81'

$hasVerifiedLibrary = (Test-Path -LiteralPath $nativeFilePath) -and
    ((Get-FileHash -LiteralPath $nativeFilePath -Algorithm SHA256).Hash -eq $expectedSha256)

if (-not $hasVerifiedLibrary) {
    New-Item -ItemType Directory -Path $nativeDirectory -Force | Out-Null
    $downloadPath = Join-Path $nativeDirectory ($nativeFileName + '.download')
    [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
    Write-Host 'Downloading the Microsoft JDBC Windows authentication library...'
    Invoke-WebRequest -Uri $downloadUrl -OutFile $downloadPath -UseBasicParsing -TimeoutSec 60
    if ((Get-FileHash -LiteralPath $downloadPath -Algorithm SHA256).Hash -ne $expectedSha256) {
        throw 'Native library checksum mismatch. The application has not been started.'
    }
    Move-Item -LiteralPath $downloadPath -Destination $nativeFilePath -Force
}

Write-Host 'Microsoft JDBC Windows authentication library: SHA-256 verified.'
if ($PrepareOnly) {
    return
}

$previousRoutingProxy=[Environment]::GetEnvironmentVariable('ROUTING_PROXY_URL','Process')
if(-not$previousRoutingProxy){
    $routeUri=[Uri]$(if($env:ROUTING_URL){$env:ROUTING_URL}else{'https://valhalla1.openstreetmap.de/route'})
    $proxyUri=[Net.WebRequest]::DefaultWebProxy.GetProxy($routeUri)
    if($proxyUri -and $proxyUri.AbsoluteUri-ne$routeUri.AbsoluteUri){$env:ROUTING_PROXY_URL=$proxyUri.AbsoluteUri}
}
Push-Location $projectDirectory
try {
    if ($UsePackagedJar) {
        $jarPath = Join-Path $projectDirectory 'runtime\ecothugom-backend.jar'
        if (-not (Test-Path -LiteralPath $jarPath -PathType Leaf)) { throw 'Packaged JAR not found. Extract the demo ZIP or run without -UsePackagedJar to build from source.' }
        & java --enable-native-access=ALL-UNNAMED "-Djava.library.path=$nativeDirectory" -jar $jarPath
    } else {
        & (Join-Path $projectDirectory 'mvnw.cmd') -B -ntp spring-boot:run
    }
    if ($LASTEXITCODE -ne 0) {
        throw "Spring Boot exited with code $LASTEXITCODE."
    }
}
finally {
    [Environment]::SetEnvironmentVariable('ROUTING_PROXY_URL',$previousRoutingProxy,'Process')
    Pop-Location
}
