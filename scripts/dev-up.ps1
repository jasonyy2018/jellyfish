Write-Host "Starting Jellyfish monorepo services..."
Start-Process powershell -ArgumentList "npm run dev:api"
Start-Process powershell -ArgumentList "npm run dev:dashboard"
Start-Process powershell -ArgumentList "npm run dev:web"
