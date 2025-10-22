# Start dev dependencies and run backend + frontend
# Usage: .\scripts\start-dev.ps1

Write-Host "Starting Postgres and Redis via docker-compose..."
docker-compose up -d

Write-Host "Waiting for Postgres to be ready..."
# Wait a bit (naive)
Start-Sleep -s 5

Write-Host "Run EF migrations..."
Push-Location src/Web
dotnet ef database update
Pop-Location

Write-Host "Starting backend (dotnet run) and frontend (pnpm dev) in separate terminals..."
# Start backend
Start-Process powershell -ArgumentList '-NoExit','-Command','cd src/Web; dotnet run'
# Start frontend
Start-Process powershell -ArgumentList '-NoExit','-Command','cd src/Web/frontend; pnpm dev'

Write-Host "Dev environment launched."
