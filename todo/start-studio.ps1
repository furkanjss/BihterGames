$ErrorActionPreference = 'Stop'
$todoDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 5174
$url = "http://localhost:$port/"

function Test-Server {
  try {
    $res = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2
    return $res.StatusCode -ge 200
  } catch {
    return $false
  }
}

Set-Location $todoDir

if (-not (Test-Server)) {
  if (-not (Test-Path "$todoDir\node_modules")) {
    npm install | Out-Null
  }

  Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory $todoDir -WindowStyle Hidden

  $ready = $false
  for ($i = 0; $i -lt 40; $i++) {
    Start-Sleep -Milliseconds 500
    if (Test-Server) {
      $ready = $true
      break
    }
  }

  if (-not $ready) {
    Add-Type -AssemblyName PresentationFramework
    [System.Windows.MessageBox]::Show(
      "Studio could not start. Open a terminal in the todo folder and run: npm run dev",
      "Bihter Games Studio"
    )
    exit 1
  }
}

$edge = @(
  "$env:ProgramFiles (x86)\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

$chrome = @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "$env:ProgramFiles (x86)\Google\Chrome\Application\chrome.exe",
  "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if ($edge) {
  Start-Process $edge -ArgumentList "--app=$url", "--new-window"
} elseif ($chrome) {
  Start-Process $chrome -ArgumentList "--app=$url", "--new-window"
} else {
  Start-Process $url
}
