param(
    [string]$MongoUri = 'mongodb://localhost:27017/wealthflow'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$dumpDir = Join-Path $repoRoot 'database\mongodump'
$archivePath = Join-Path $dumpDir 'wealthflow.archive.gz'

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw 'Required command not found: docker'
}

if (-not (Test-Path $archivePath)) {
    throw "Dump archive not found: $archivePath"
}

Push-Location $repoRoot
try {
    Write-Host '[restore-dump] Starting mongo service...'
    docker compose up -d mongo | Out-Null

    $dockerMongoUri = $MongoUri -replace 'localhost', 'host.docker.internal' -replace '127\.0\.0\.1', 'host.docker.internal'
    $dumpDirResolved = (Resolve-Path $dumpDir).Path

    Write-Host '[restore-dump] Restoring archive with --drop...'
    docker run --rm -v "${dumpDirResolved}:/dump" mongo:latest mongorestore --gzip --archive=/dump/wealthflow.archive.gz --uri "$dockerMongoUri" --drop

    Write-Host '[restore-dump] Restore complete.'
} finally {
    Pop-Location
}
