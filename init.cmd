@echo off
setlocal

rem LoreCanvas harness entrypoint for cmd.exe and automation on Windows.

cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js is required to run the LoreCanvas harness. 1>&2
  exit /b 1
)

node .\scripts\init.mjs
exit /b %ERRORLEVEL%
