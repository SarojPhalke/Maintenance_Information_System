# PowerShell script to fix database connection issues

Write-Host "Fixing Backend Database Connection Issues..." -ForegroundColor Cyan
Write-Host ""

# 1. Kill process on port 3000
Write-Host "1. Checking port 3000..." -ForegroundColor Yellow
$port3000 = netstat -ano | findstr :3000
if ($port3000) {
    Write-Host "   Port 3000 is in use" -ForegroundColor Yellow
    $processId = ($port3000 -split '\s+')[-1]
    Write-Host "   Killing process $processId..." -ForegroundColor Yellow
    taskkill /PID $processId /F 2>$null
    Start-Sleep -Seconds 2
    Write-Host "   Port 3000 freed" -ForegroundColor Green
} else {
    Write-Host "   Port 3000 is available" -ForegroundColor Green
}

Write-Host ""
Write-Host "2. Checking and fixing .env file..." -ForegroundColor Yellow

$envPath = ".\.env"
$needsFix = $false
$fixed = $false

if (Test-Path $envPath) {
    $envLines = Get-Content $envPath
    $newLines = @()
    
    foreach ($line in $envLines) {
        $newLine = $line
        
        # Fix DB_HOST
        if ($line -match "^DB_HOST=postgres") {
            Write-Host "   Fixing: DB_HOST=postgres -> DB_HOST=localhost" -ForegroundColor Yellow
            $newLine = "DB_HOST=localhost"
            $needsFix = $true
            $fixed = $true
        }
        
        # Fix DB_USER
        if ($line -match "^DB_USER=localhost") {
            Write-Host "   Fixing: DB_USER=localhost -> DB_USER=postgres" -ForegroundColor Yellow
            $newLine = "DB_USER=postgres"
            $needsFix = $true
            $fixed = $true
        }
        
        # Check for missing or default password
        if ($line -match "^DB_PASSWORD=") {
            $password = ($line -split "=")[1]
            if ([string]::IsNullOrWhiteSpace($password) -or $password -eq "your_password_here" -or $password -eq "1234") {
                Write-Host "   WARNING: DB_PASSWORD is not set or using default value!" -ForegroundColor Red
                Write-Host "      You need to set your actual PostgreSQL password" -ForegroundColor Red
            }
        }
        
        $newLines += $newLine
    }
    
    # Auto-fix if needed
    if ($fixed) {
        Write-Host "   Saving fixed .env file..." -ForegroundColor Yellow
        $newLines | Set-Content $envPath
        Write-Host "   .env file fixed!" -ForegroundColor Green
    } else {
        Write-Host "   .env file structure looks correct" -ForegroundColor Green
    }
    
    # Display current config (without password)
    Write-Host ""
    Write-Host "   Current .env configuration:" -ForegroundColor Cyan
    foreach ($line in $newLines) {
        if ($line -match "^DB_") {
            if ($line -match "^DB_PASSWORD=") {
                $passLine = $line.Split('=')[0]
                Write-Host "   $passLine=***" -ForegroundColor Gray
            } else {
                Write-Host "   $line" -ForegroundColor Gray
            }
        }
    }
    
} else {
    Write-Host "   .env file not found! Creating template..." -ForegroundColor Red
    $template = @"
# Database Configuration (WSL PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mis_db
DB_USER=postgres
DB_PASSWORD=YOUR_PASSWORD_HERE

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=3000
"@
    $template | Set-Content $envPath
    Write-Host "   Created .env template file" -ForegroundColor Green
    Write-Host "   Please edit .env and set DB_PASSWORD to your actual PostgreSQL password!" -ForegroundColor Red
}

Write-Host ""
Write-Host "3. Testing database connection..." -ForegroundColor Yellow

# Check if WSL is available
$wslAvailable = $false
try {
    $wslCheck = wsl --list --quiet 2>&1
    if ($LASTEXITCODE -eq 0) {
        $wslAvailable = $true
        Write-Host "   WSL is available" -ForegroundColor Green
        
        Write-Host ""
        Write-Host "   To test PostgreSQL connection, run in WSL:" -ForegroundColor Cyan
        Write-Host "   wsl" -ForegroundColor White
        Write-Host "   sudo service postgresql status" -ForegroundColor White
        Write-Host "   psql -h localhost -U postgres -d mis_db" -ForegroundColor White
    }
} catch {
    Write-Host "   WSL not available or not configured" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "4. Troubleshooting Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   If you get password authentication failed:" -ForegroundColor Cyan
Write-Host "   1. Verify PostgreSQL password in WSL:" -ForegroundColor White
Write-Host "      wsl" -ForegroundColor Gray
Write-Host "      sudo -u postgres psql" -ForegroundColor Gray
Write-Host "      ALTER USER postgres PASSWORD 'your_new_password';" -ForegroundColor Gray
Write-Host ""
Write-Host "   2. Or reset PostgreSQL password:" -ForegroundColor White
Write-Host "      wsl" -ForegroundColor Gray
Write-Host "      sudo -u postgres psql -c \"ALTER USER postgres WITH PASSWORD 'newpassword';\"" -ForegroundColor Gray
Write-Host ""
Write-Host "   3. Update DB_PASSWORD in .env file with the correct password" -ForegroundColor White
Write-Host ""
Write-Host "   If database mis_db does not exist:" -ForegroundColor Cyan
Write-Host "      wsl" -ForegroundColor Gray
Write-Host "      createdb -h localhost -U postgres mis_db" -ForegroundColor Gray

Write-Host ""
Write-Host "============================================================" -ForegroundColor Gray
Write-Host "Fix script completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Verify DB_PASSWORD in .env file matches your PostgreSQL password" -ForegroundColor White
Write-Host "2. Ensure PostgreSQL is running in WSL" -ForegroundColor White
Write-Host "3. Run: npm run dev" -ForegroundColor White
Write-Host ""
