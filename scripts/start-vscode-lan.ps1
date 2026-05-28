param(
  [string]$WorkspacePath = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path,
  [int]$Port = 8000,
  [string]$ListenHost = '0.0.0.0',
  [string]$ConnectionToken = 'adg-lan'
)

$workspacePath = (Resolve-Path $WorkspacePath).Path
$codeCommand = (Get-Command code-tunnel.exe -ErrorAction Stop).Source

$tokenDirectory = Join-Path $env:USERPROFILE '.vscode\cli'
$tokenFile = Join-Path $tokenDirectory 'serve-web-token'

if (-not (Test-Path $tokenDirectory)) {
  New-Item -ItemType Directory -Path $tokenDirectory | Out-Null
}

$currentToken = if (Test-Path $tokenFile) {
  (Get-Content -Path $tokenFile -Raw).Trim()
} else {
  ''
}

$tokenChanged = $currentToken -ne $ConnectionToken

if ($tokenChanged) {
  $ConnectionToken | Set-Content -Path $tokenFile -Encoding ascii
}

$token = $ConnectionToken

$relatedProcesses = Get-CimInstance Win32_Process |
  Where-Object {
    $_.CommandLine -like '*\.vscode\cli\serve-web*' -or
    $_.CommandLine -like '*serve-web-token*'
  } |
  Select-Object ProcessId, Name, CommandLine

$listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
  Select-Object -First 1

$listenerProcess = if ($listener) {
  Get-CimInstance Win32_Process -Filter "ProcessId = $($listener.OwningProcess)" -ErrorAction SilentlyContinue
} else {
  $null
}

$listenerIsVsCodeLan = $listenerProcess -and (
  $listenerProcess.CommandLine -like '*\.vscode\cli\serve-web*' -or
  $listenerProcess.CommandLine -like '*serve-web-token*'
)

if ($tokenChanged -and ($relatedProcesses -or $listenerIsVsCodeLan)) {
  @($relatedProcesses.ProcessId + $listenerProcess.ProcessId) |
    Where-Object { $_ } |
    Select-Object -Unique |
    ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }

  $relatedProcesses = @()
  $listener = $null
}

if (-not $relatedProcesses -and $listener -and -not $listenerIsVsCodeLan) {
  Write-Error "Port $Port is already in use by another process. VS Code LAN access was not started."
  exit 1
}

$lanIp = Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object {
    $_.IPAddress -notmatch '^127\.' -and
    $_.PrefixOrigin -ne 'WellKnown'
  } |
  Select-Object -ExpandProperty IPAddress -First 1

if (-not $lanIp) {
  $lanIp = 'localhost'
}

Write-Host "VS Code LAN access ready: http://${lanIp}:${Port}?tkn=${token}"
Write-Host 'If the phone cannot connect, allow TCP port 8000 for Private networks in Windows Firewall.'

if (-not $relatedProcesses) {
  & $codeCommand @(
    'serve-web',
    '--host',
    $ListenHost,
    '--port',
    $Port.ToString(),
    '--connection-token-file',
    $tokenFile,
    '--accept-server-license-terms',
    '--default-folder',
    $workspacePath
  )
}