$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$backendRoot = Split-Path -Parent $PSScriptRoot
$backup = Join-Path $backendRoot '.local\sql-port-before-1435.json'
$result = Join-Path $backendRoot '.local\sql-port-1435-result.txt'
try {
    $instances = Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\Instance Names\SQL'
    $instanceId = $instances.MSSQLSERVER01
    if ($instanceId -notmatch '^MSSQL\d+\.MSSQLSERVER01$') { throw 'Unexpected SQL instance identity.' }
    $tcpRoot = "HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\$instanceId\MSSQLServer\SuperSocketNetLib\Tcp"
    $tcp = Get-ItemProperty $tcpRoot
    if ($tcp.Enabled -ne 1 -or $tcp.ListenOnAllIPs -ne 1) { throw 'Expected enabled TCP with ListenOnAllIPs.' }
    $ipAll = Join-Path $tcpRoot 'IPAll'
    $current = Get-ItemProperty $ipAll
    $service = Get-Service -Name 'MSSQL$MSSQLSERVER01'
    if ($current.TcpPort -eq '1435' -and $current.TcpDynamicPorts -eq '' -and $service.Status -eq 'Running') {
        'SQL Server MSSQLSERVER01 already running on configured port 1435.' | Set-Content $result
        exit 0
    }
    if (Get-NetTCPConnection -LocalPort 1435 -State Listen -ErrorAction SilentlyContinue) { throw 'TCP 1435 is already in use.' }
    if (-not (Test-Path -LiteralPath $backup)) {
        @{ instance = 'MSSQLSERVER01'; registryPath = $ipAll; tcpPort = $current.TcpPort; tcpDynamicPorts = $current.TcpDynamicPorts } |
            ConvertTo-Json | Set-Content -LiteralPath $backup
    }
    if ($service.Status -ne 'Stopped') { throw 'Expected the project SQL instance to be stopped before changing its port.' }
    Set-ItemProperty -LiteralPath $ipAll -Name TcpPort -Value '1435'
    Set-ItemProperty -LiteralPath $ipAll -Name TcpDynamicPorts -Value ''
    Start-Service -Name 'MSSQL$MSSQLSERVER01'
    $service.WaitForStatus('Running', [TimeSpan]::FromSeconds(30))
    'SQL Server MSSQLSERVER01 is running with static TCP port 1435. Other SQL instances were not changed.' | Set-Content $result
} catch {
    $_.Exception.Message | Set-Content -LiteralPath $result
    exit 1
}

