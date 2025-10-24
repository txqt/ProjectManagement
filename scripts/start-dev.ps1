# Start dev dependencies and run backend + frontend
# Usage: .\scripts\start-dev.ps1

Write-Host "Checking Docker availability..."
$dockerExists = (Get-Command docker -ErrorAction SilentlyContinue) -ne $null
$composeExists = (Get-Command docker-compose -ErrorAction SilentlyContinue) -ne $null

if ($dockerExists -and $composeExists) {
    Write-Host "Docker detected. Starting Postgres and Redis via docker-compose..."
    docker-compose up -d
    Write-Host "Waiting for Postgres to be ready..."
    Start-Sleep -Seconds 5
}
else {
    Write-Host "Docker or docker-compose not found. Assuming local Postgres/Redis are already running."
}

# Ask user whether to run EF migrations
$runMigrations = Read-Host "Do you want to run 'dotnet ef database update'? (y/n)"
if ($runMigrations -eq "y" -or $runMigrations -eq "Y") {
    Write-Host "Running EF migrations..."
    Push-Location "$PSScriptRoot/../src/Web"
    dotnet ef database update
    Pop-Location
}
else {
    Write-Host "Skipping EF migrations."
}

Write-Host "Starting backend (dotnet run) and frontend (pnpm dev) in separate terminals..."

# Start backend
Start-Process powershell -ArgumentList '-NoExit','-Command',"cd '$PSScriptRoot/../src/Web'; dotnet run --launch-profile 'https'"

# Start frontend
Start-Process powershell -ArgumentList '-NoExit','-Command',"cd '$PSScriptRoot/../src/Web/frontend'; pnpm dev"

# Optional: start redis script if exists
$redisScript = Join-Path $PSScriptRoot "../redis/start.bat"
if (Test-Path $redisScript) {
    Start-Process powershell -ArgumentList '-NoExit','-Command',"& '$redisScript'"
}

Write-Host "Dev environment launched."