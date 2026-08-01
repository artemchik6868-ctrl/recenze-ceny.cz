# Fix corrupted node_modules on Windows (run when no other npm/node builds are active)

Write-Host "Stopping stray node processes in offer-pulse-showcase-sl (optional)..."
Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*nodejs*" } | ForEach-Object { Write-Host "  node pid $($_.Id)" }

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $scriptDir
Set-Location $root

if (Test-Path node_modules) {
  $bak = "node_modules._trash_$(Get-Date -Format 'yyyyMMddHHmmss')"
  Write-Host "Renaming node_modules -> $bak"
  Rename-Item node_modules $bak -Force
}

$esLock = Join-Path (Split-Path -Parent $root) "offer-pulse-showcase-es\package-lock.json"
if (-not (Test-Path $esLock)) { throw "ES package-lock.json not found: $esLock" }
Copy-Item $esLock package-lock.json -Force
npm ci
if ($LASTEXITCODE -eq 0) { npm run build }
