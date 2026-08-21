# Quick deployment script for AnswerIQ Cloudflare Workers
# This script automates the deployment process

param(
    [switch]$Backend,
    [switch]$Frontend,
    [switch]$All,
    [switch]$Test,
    [string]$ProjectName = "answeriq-frontend"
)

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host "`n🚀 $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

# Check if wrangler is installed
function Test-Wrangler {
    try {
        $null = wrangler --version
        return $true
    } catch {
        return $false
    }
}

# Main deployment logic
if (-not (Test-Wrangler)) {
    Write-Error "Wrangler CLI not found!"
    Write-Host "Install with: npm install -g wrangler" -ForegroundColor Yellow
    exit 1
}

Write-Host @"
╔════════════════════════════════════════╗
║   AnswerIQ Cloudflare Deployment      ║
╚════════════════════════════════════════╝
"@ -ForegroundColor Magenta

if ($Test) {
    Write-Step "Testing Worker locally..."
    
    # Start wrangler dev in background
    $job = Start-Job -ScriptBlock { 
        Set-Location $using:PWD
        wrangler dev 
    }
    
    Write-Host "Waiting for worker to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    # Run test
    .\test-worker.ps1 "http://localhost:8787"
    
    # Stop background job
    Stop-Job $job
    Remove-Job $job
    
    Write-Success "Test complete!"
    exit 0
}

if ($Backend -or $All) {
    Write-Step "Deploying Worker (Backend)..."
    
    try {
        wrangler deploy
        Write-Success "Worker deployed successfully!"
        Write-Host "Your worker URL will be shown above ☝" -ForegroundColor Yellow
    } catch {
        Write-Error "Worker deployment failed: $_"
        exit 1
    }
}

if ($Frontend -or $All) {
    Write-Step "Deploying Frontend (Pages)..."
    
    # Check if we need to exclude backend files
    $excludeFiles = @(
        "backend",
        "*.py",
        "*.md",
        "*.ps1",
        "wrangler.toml",
        "worker.js",
        ".git",
        ".dev.vars"
    )
    
    try {
        # Deploy only HTML, CSS, JS files
        wrangler pages deploy . --project-name=$ProjectName
        Write-Success "Frontend deployed successfully!"
        Write-Host "Your Pages URL will be shown above ☝" -ForegroundColor Yellow
    } catch {
        Write-Error "Frontend deployment failed: $_"
        exit 1
    }
}

if (-not $Backend -and -not $Frontend -and -not $All -and -not $Test) {
    Write-Host @"
Usage:
  .\deploy.ps1 -All              Deploy both backend and frontend
  .\deploy.ps1 -Backend          Deploy only the Worker
  .\deploy.ps1 -Frontend         Deploy only the Pages site
  .\deploy.ps1 -Test             Test Worker locally
  
Options:
  -ProjectName <name>            Custom Pages project name (default: answeriq-frontend)

Examples:
  .\deploy.ps1 -All
  .\deploy.ps1 -Backend
  .\deploy.ps1 -Frontend -ProjectName my-answeriq
  .\deploy.ps1 -Test
"@ -ForegroundColor Yellow
    exit 0
}

Write-Host "`n╔════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║        Deployment Complete! 🎉        ║" -ForegroundColor Magenta
Write-Host "╚════════════════════════════════════════╝`n" -ForegroundColor Magenta

Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Copy your Worker URL from above"
Write-Host "2. Open your Pages URL"
Write-Host "3. Click ⚙ Settings and paste the Worker URL"
Write-Host "4. (Optional) Add Gemini API key for AI suggestions"
Write-Host ""
Write-Host "For detailed setup, see CLOUDFLARE_DEPLOYMENT.md" -ForegroundColor Yellow
