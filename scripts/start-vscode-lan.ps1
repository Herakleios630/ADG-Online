param(
  [string]$WorkspacePath = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path,
  [int]$Port = 8000,
  [string]$ListenHost = '0.0.0.0'
)

$workspacePath = (Resolve-Path $WorkspacePath).Path
$codeCommand = (Get-Command code -ErrorAction Stop).Source

$tokenDirectory = Join-Path $env:LOCALAPPDATA 'AdGOnline'
$tokenFile = Join-Path $tokenDirectory 'vscode-lan-token.txt'

if (-not (Test-Path $tokenDirectory)) {
  New-Item -ItemType Directory -Path $tokenDirectory | Out-Null
}

if (-not (Test-Path $tokenFile)) {
  [guid]::NewGuid().Guid | Set-Content -Path $tokenFile -Encoding ascii
}

$token = (Get-Content -Path $tokenFile -Raw).Trim()

$existingProcess = Get-CimInstance Win32_Process -Filter "Name = 'code-tunnel.exe'" |
  Where-Object {
    $_.CommandLine -like '*serve-web*' -and
    $_.CommandLine -like "*--port $Port*"
  } |
  Select-Object -First 1

$listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
  Select-Object -First 1

if (-not $existingProcess -and $listener) {
  Write-Error "Port $Port is already in use by another process. VS Code LAN access was not started."
  exit 1
}

if (-not $existingProcess) {
  Start-Process -FilePath $codeCommand -ArgumentList @(
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
  ) | Out-Null
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