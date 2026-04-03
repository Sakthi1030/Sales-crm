$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$nodeDir = Join-Path $root ".tools\node-v24.14.1-win-x64"
$pgBase = Join-Path $root ".tools\postgresql-16"
$pgData = Join-Path $pgBase "data"
$pgOut = Join-Path $pgBase "postgres-5433.out.log"
$pgErr = Join-Path $pgBase "postgres-5433.err.log"
$backendOut = Join-Path $root "backend-dev.out.log"
$backendErr = Join-Path $root "backend-dev.err.log"
$frontendOut = Join-Path $root "frontend-dev.out.log"
$frontendErr = Join-Path $root "frontend-dev.err.log"

function Test-Url($url) {
  try {
    Invoke-WebRequest -UseBasicParsing $url | Out-Null
    return $true
  } catch {
    return $false
  }
}

function Ensure-Postgres {
  if (-not (Get-Process postgres -ErrorAction SilentlyContinue)) {
    Start-Process `
      -FilePath (Join-Path $pgBase "pgsql\bin\postgres.exe") `
      -ArgumentList "-D", $pgData, "-p", "5433", "-h", "127.0.0.1" `
      -RedirectStandardOutput $pgOut `
      -RedirectStandardError $pgErr `
      -WindowStyle Hidden
    Start-Sleep -Seconds 5
  }
}

function Ensure-Backend {
  if (-not (Test-Url "http://localhost:5000/api/health")) {
    Start-Process `
      -FilePath (Join-Path $nodeDir "node.exe") `
      -ArgumentList "server.js" `
      -WorkingDirectory (Join-Path $root "backend") `
      -RedirectStandardOutput $backendOut `
      -RedirectStandardError $backendErr `
      -WindowStyle Hidden
    Start-Sleep -Seconds 5
  }
}

function Ensure-Frontend {
  if (-not (Test-Url "http://localhost:3000")) {
    Start-Process `
      -FilePath (Join-Path $nodeDir "node.exe") `
      -ArgumentList (Join-Path $root "frontend\node_modules\react-scripts\bin\react-scripts.js"), "start" `
      -WorkingDirectory (Join-Path $root "frontend") `
      -RedirectStandardOutput $frontendOut `
      -RedirectStandardError $frontendErr `
      -WindowStyle Hidden
    Start-Sleep -Seconds 15
  }
}

Ensure-Postgres
Ensure-Backend
Ensure-Frontend

Write-Host ""
Write-Host "Nexus CRM local services:"
Write-Host "Frontend: http://localhost:3000"
Write-Host "Backend:  http://localhost:5000/api/health"
Write-Host "Database: PostgreSQL on 127.0.0.1:5433"
Write-Host ""
