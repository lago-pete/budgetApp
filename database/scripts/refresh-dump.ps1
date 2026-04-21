param(
    [string]$MongoUri = 'mongodb://localhost:27017/wealthflow'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$serverDir = Join-Path $repoRoot 'server'
$dumpDir = Join-Path $repoRoot 'database\mongodump'
$archivePath = Join-Path $dumpDir 'wealthflow.archive.gz'

function Assert-Command([string]$Name) {
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Required command not found: $Name"
    }
}

function Wait-ForMongo {
    $ready = $false
    for ($i = 0; $i -lt 40; $i++) {
        try {
            $ping = docker compose exec -T mongo mongosh --quiet --eval "db.runCommand({ ping: 1 }).ok" 2>$null
            if (($ping | Out-String).Trim() -eq '1') {
                $ready = $true
                break
            }
        } catch {
            # Keep waiting
        }
        Start-Sleep -Seconds 2
    }

    if (-not $ready) {
        throw 'MongoDB did not become ready in time.'
    }
}

Assert-Command docker
Assert-Command npm

New-Item -ItemType Directory -Force -Path $dumpDir | Out-Null

Push-Location $repoRoot
try {
    Write-Host '[refresh-dump] Starting mongo service...'
    docker compose up -d mongo | Out-Null

    Write-Host '[refresh-dump] Waiting for mongo readiness...'
    Wait-ForMongo

    $nodeModulesPath = Join-Path $serverDir 'node_modules'
    if (-not (Test-Path $nodeModulesPath)) {
        Write-Host '[refresh-dump] Installing server dependencies...'
        npm --prefix $serverDir install --no-package-lock
    } else {
        Write-Host '[refresh-dump] Server dependencies already installed.'
    }

    Write-Host '[refresh-dump] Seeding deterministic submission dataset...'
    $env:MONGO_URI = $MongoUri
    $env:RESET_FULL_DATASET = '1'
    npm --prefix $serverDir run seed:submission
    Remove-Item Env:MONGO_URI -ErrorAction SilentlyContinue
    Remove-Item Env:RESET_FULL_DATASET -ErrorAction SilentlyContinue

    if (Test-Path $archivePath) {
        Remove-Item -LiteralPath $archivePath -Force
    }

    $dockerMongoUri = $MongoUri -replace 'localhost', 'host.docker.internal' -replace '127\.0\.0\.1', 'host.docker.internal'
    $dumpDirResolved = (Resolve-Path $dumpDir).Path

    Write-Host '[refresh-dump] Exporting mongodump archive...'
    docker run --rm -v "${dumpDirResolved}:/dump" mongo:latest mongodump --gzip --archive=/dump/wealthflow.archive.gz --uri "$dockerMongoUri"

    if (-not (Test-Path $archivePath)) {
        throw "Dump archive was not created at $archivePath"
    }

    $size = (Get-Item $archivePath).Length
    if ($size -le 0) {
        throw "Dump archive is empty: $archivePath"
    }

    Write-Host "[refresh-dump] Done: $archivePath ($size bytes)"
} finally {
    Pop-Location
}
