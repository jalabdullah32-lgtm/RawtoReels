@echo off
cd /d "%~dp0"
if exist ".venv\Scripts\python.exe" (
  .venv\Scripts\python.exe tools\server.py
) else (
  py -3 tools\server.py
)
if errorlevel 1 pause
