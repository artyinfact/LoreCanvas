[CmdletBinding()]
param(
  [switch]$NoRestart
)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$metadataPath = Join-Path $root "agent_work\dev-server.json"
$server = $null

if (Test-Path -LiteralPath $metadataPath) {
  $metadata = Get-Content -Raw -LiteralPath $metadataPath | ConvertFrom-Json
  $recordedRoot = [System.IO.Path]::GetFullPath([string]$metadata.root)

  if ($recordedRoot -ne $root) {
    throw "Refusing to stop a dev server registered for another repository: $recordedRoot"
  }

  if (
    -not ($metadata.childPid -as [int]) -or
    -not ($metadata.wrapperPid -as [int]) -or
    -not ($metadata.args -is [System.Array])
  ) {
    throw "LoreCanvas dev server metadata is malformed: $metadataPath"
  }

  $child = Get-CimInstance Win32_Process -Filter "ProcessId = $($metadata.childPid)"
  $wrapper = Get-CimInstance Win32_Process -Filter "ProcessId = $($metadata.wrapperPid)"

  if (-not $child -or -not $wrapper) {
    throw "LoreCanvas dev server metadata is stale. Stop any remaining process and remove $metadataPath."
  }

  $normalizedCommand = ([string]$child.CommandLine).Replace("\", "/").ToLowerInvariant()
  $normalizedWrapperCommand = ([string]$wrapper.CommandLine).Replace("\", "/").ToLowerInvariant()
  $expectedVitePath = (Join-Path $root "node_modules\vite\bin\vite.js").
    Replace("\", "/").
    ToLowerInvariant()
  $expectedWrapperPath = (Join-Path $root "scripts\dev-server.mjs").
    Replace("\", "/").
    ToLowerInvariant()
  $expectedRelativeWrapper = "scripts/dev-server.mjs"

  if (-not $normalizedCommand.Contains($expectedVitePath)) {
    throw "Refusing to stop PID $($metadata.childPid): it is not the registered LoreCanvas Vite entry."
  }
  if (
    -not $normalizedWrapperCommand.Contains($expectedWrapperPath) -and
    -not $normalizedWrapperCommand.Contains($expectedRelativeWrapper)
  ) {
    throw "Refusing to stop PID $($metadata.childPid): its registered wrapper is not LoreCanvas dev-server.mjs."
  }
  if ([int]$child.ParentProcessId -ne [int]$metadata.wrapperPid) {
    throw "Refusing to stop PID $($metadata.childPid): it is not a child of the registered LoreCanvas wrapper."
  }

  $server = [pscustomobject]@{
    ChildPid = [int]$metadata.childPid
    WrapperPid = [int]$metadata.wrapperPid
    Args = @($metadata.args | ForEach-Object { [string]$_ })
  }
}

if ($server) {
  Write-Host "Stopping registered LoreCanvas Vite server (PID $($server.ChildPid))."
  Stop-Process -Id $server.ChildPid -Force

  for ($attempt = 0; $attempt -lt 30; $attempt += 1) {
    if (-not (Get-Process -Id $server.WrapperPid -ErrorAction SilentlyContinue)) {
      break
    }
    Start-Sleep -Milliseconds 100
  }

  if (Get-Process -Id $server.WrapperPid -ErrorAction SilentlyContinue) {
    throw "LoreCanvas dev wrapper did not exit after its registered Vite child stopped."
  }
}

try {
  & (Join-Path $root "init.ps1")
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
}
finally {
  if ($server -and -not $NoRestart) {
    Write-Host "Restarting the registered LoreCanvas Vite server."
    $arguments = @("run", "dev", "--") + $server.Args
    Start-Process `
      -FilePath "npm.cmd" `
      -ArgumentList $arguments `
      -WorkingDirectory $root `
      -WindowStyle Hidden | Out-Null
  }
}
