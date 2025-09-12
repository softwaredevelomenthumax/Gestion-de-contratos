# Contract Management App Deployment Script
# This script handles the complete deployment process

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  Contract Management App Deployment" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan

# Navigate to project directory
$projectPath = "\\SVR2\Users\miguel.isaza\App"
Set-Location $projectPath

Write-Host "`n📍 Project Directory: $projectPath" -ForegroundColor Green

# Pull latest changes
Write-Host "`n🔄 Pulling latest changes from Git..." -ForegroundColor Yellow
try {
    git pull origin main
    Write-Host "✅ Git pull successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Git pull failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Deploy Backend
Write-Host "`n🚀 Deploying Backend (Express.js API)..." -ForegroundColor Yellow
Set-Location "my-express-api"

try {
    Write-Host "📦 Installing backend dependencies..." -ForegroundColor Cyan
    npm install --production
    
    Write-Host "🔄 Restarting backend with PM2..." -ForegroundColor Cyan
    pm2 restart contract-api
    
    Write-Host "✅ Backend deployment successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Deploy Frontend
Write-Host "`n🎨 Deploying Frontend (React App)..." -ForegroundColor Yellow
Set-Location "../Frontend"

try {
    Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Cyan
    npm install
    
    Write-Host "🔨 Building frontend..." -ForegroundColor Cyan
    npm run build
    
    Write-Host "🔄 Restarting frontend with PM2..." -ForegroundColor Cyan
    pm2 restart contract-frontend
    
    Write-Host "✅ Frontend deployment successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Show final status
Write-Host "`n📊 Final Status:" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
pm2 status

Write-Host "`n🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host "🌐 Backend API: http://10.255.6.4:3001" -ForegroundColor Cyan
Write-Host "🌐 Frontend App: http://10.255.6.4:5173" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
