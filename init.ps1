$ErrorActionPreference = "Stop"

# LoreCanvas harness entrypoint for Windows PowerShell / PowerShell.

Set-Location $PSScriptRoot

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error "Node.js is required to run the LoreCanvas harness."
  exit 1
}

node .\scripts\init.mjs
exit $LASTEXITCODE
