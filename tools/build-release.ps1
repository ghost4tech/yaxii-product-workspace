param(
    [switch]$UseCommittedAssets
)

$ErrorActionPreference = 'Stop'
$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$manifestPath = Join-Path $repositoryRoot 'release-manifest.json'
$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
$distRoot = Join-Path $repositoryRoot 'dist'
$stagingRoot = Join-Path $distRoot '.release-staging'
$pluginRoot = Join-Path $stagingRoot $manifest.plugin_slug
$zipPath = Join-Path $distRoot ("{0}-{1}.zip" -f $manifest.plugin_slug, $manifest.version)
$evidencePath = Join-Path $distRoot ("{0}-{1}.manifest.json" -f $manifest.plugin_slug, $manifest.version)

Push-Location $repositoryRoot
try {
    $status = git status --porcelain=v1 --untracked-files=all
    if ($LASTEXITCODE -ne 0 -or $status) {
        throw 'Release packaging requires a clean committed checkout.'
    }

    $sourceSha = (git rev-parse HEAD).Trim()
    $header = Get-Content -LiteralPath 'yaxii-product-workspace.php' -Raw
    if ($header -notmatch "Version:\s+$([regex]::Escape($manifest.version))\b") {
        throw 'Plugin header version does not match release-manifest.json.'
    }

    if (-not $UseCommittedAssets) {
        npm --prefix apps/product-butler ci
        if ($LASTEXITCODE -ne 0) { throw 'npm ci failed.' }
        npm --prefix apps/product-butler run build
        if ($LASTEXITCODE -ne 0) { throw 'Frontend build failed.' }
        npm --prefix apps/product-butler run check:i18n
        if ($LASTEXITCODE -ne 0) { throw 'Localization gate failed.' }
        node tools/generate-third-party-licenses.mjs
        if ($LASTEXITCODE -ne 0) { throw 'Third-party license inventory failed.' }
        git diff --quiet --exit-code
        if ($LASTEXITCODE -ne 0) {
            throw 'The clean checkout did not reproduce the committed generated assets.'
        }
    }

    New-Item -ItemType Directory -Force -Path $pluginRoot | Out-Null
    $patterns = @($manifest.include | ForEach-Object { [WildcardPattern]::new($_, 'IgnoreCase') })
    $trackedFiles = @(git ls-files | Where-Object {
        $candidate = $_
        $patterns.Where({ $_.IsMatch($candidate) }, 'First').Count -gt 0
    } | Sort-Object)
    if ($LASTEXITCODE -ne 0 -or $trackedFiles.Count -eq 0) {
        throw 'Release manifest selected no tracked files.'
    }

    foreach ($relativePath in $trackedFiles) {
        $source = Join-Path $repositoryRoot $relativePath
        $target = Join-Path $pluginRoot $relativePath
        New-Item -ItemType Directory -Force -Path (Split-Path $target) | Out-Null
        Copy-Item -LiteralPath $source -Destination $target
    }

    composer dump-autoload --working-dir=$pluginRoot --no-dev --classmap-authoritative --no-interaction --no-scripts
    if ($LASTEXITCODE -ne 0) { throw 'Production Composer autoloader generation failed.' }

    New-Item -ItemType Directory -Force -Path $distRoot | Out-Null
    Remove-Item -LiteralPath $zipPath -Force -ErrorAction SilentlyContinue
    Add-Type -AssemblyName System.IO.Compression
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $stream = [System.IO.File]::Open($zipPath, [System.IO.FileMode]::CreateNew)
    try {
        $archive = [System.IO.Compression.ZipArchive]::new($stream, [System.IO.Compression.ZipArchiveMode]::Create, $false)
        try {
            $releaseFiles = @(Get-ChildItem -LiteralPath $pluginRoot -Recurse -File | Sort-Object FullName)
            foreach ($file in $releaseFiles) {
                $relative = $file.FullName.Substring($stagingRoot.Length + 1).Replace('\', '/')
                $entry = $archive.CreateEntry($relative, [System.IO.Compression.CompressionLevel]::Optimal)
                $entry.LastWriteTime = [DateTimeOffset]::new(2000, 1, 1, 0, 0, 0, [TimeSpan]::Zero)
                $entryStream = $entry.Open()
                try {
                    $inputStream = $file.OpenRead()
                    try { $inputStream.CopyTo($entryStream) } finally { $inputStream.Dispose() }
                } finally { $entryStream.Dispose() }
            }
        } finally { $archive.Dispose() }
    } finally { $stream.Dispose() }

    $assetHashes = [ordered]@{}
    Get-ChildItem -LiteralPath (Join-Path $pluginRoot 'assets\build') -Recurse -File | Sort-Object FullName | ForEach-Object {
        $relative = $_.FullName.Substring($pluginRoot.Length + 1).Replace('\', '/')
        $assetHashes[$relative] = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
    }
    $zip = Get-Item -LiteralPath $zipPath
    $releaseCommand = 'powershell -ExecutionPolicy Bypass -File tools/build-release.ps1'
    if ($UseCommittedAssets) { $releaseCommand += ' -UseCommittedAssets' }
    $evidence = [ordered]@{
        source_sha = $sourceSha
        release_command = $releaseCommand
        zip_path = 'dist/' + $zip.Name
        zip_sha256 = (Get-FileHash -LiteralPath $zipPath -Algorithm SHA256).Hash.ToLowerInvariant()
        zip_size_bytes = $zip.Length
        file_count = $releaseFiles.Count
        manifest = $manifest
        generated_asset_sha256 = $assetHashes
    }
    $evidence | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $evidencePath -Encoding utf8
    $evidence | ConvertTo-Json -Depth 8
} finally {
    Pop-Location
    if (Test-Path -LiteralPath $stagingRoot) {
        $resolvedDist = (Resolve-Path -LiteralPath $distRoot).Path
        $resolvedStaging = (Resolve-Path -LiteralPath $stagingRoot).Path
        if ($resolvedStaging.StartsWith($resolvedDist + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
            Remove-Item -LiteralPath $resolvedStaging -Recurse -Force
        }
    }
}
