param(
    [string]$OutputPath,
    [switch]$Force
)
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
$backend=Split-Path -Parent $PSScriptRoot
$root=Split-Path -Parent $backend
$frontend=Join-Path $root 'Frontend VCoi'
if(-not $OutputPath){$OutputPath=Join-Path $root 'dist\VCoi-demo.zip'}
$archive=[IO.Path]::GetFullPath($OutputPath)
if([IO.Path]::GetExtension($archive)-ne'.zip'){throw 'OutputPath must be a ZIP file.'}
if((Test-Path -LiteralPath $archive)-and-not $Force){throw 'Archive exists. Use -Force to replace this generated ZIP.'}
$jar=Join-Path $backend 'target\ecothugom-backend-0.0.1-SNAPSHOT.jar'
foreach($required in @($jar,(Join-Path $frontend 'dist\index.html'),(Join-Path $root 'README.md'))){if(-not(Test-Path -LiteralPath $required -PathType Leaf)){throw "Missing build input: $required. Build backend and frontend first."}}
$files=New-Object 'System.Collections.Generic.Dictionary[string,string]' ([StringComparer]::OrdinalIgnoreCase)
function Add-File([string]$source,[string]$relative){
    if((Get-Item -LiteralPath $source).Attributes-band[IO.FileAttributes]::ReparsePoint){throw 'Linked files are not packaged.'}
    $files.Add($relative.Replace('\','/'),$source)
}
function Add-Tree([string]$source,[string]$relative){
    if(-not(Test-Path -LiteralPath $source -PathType Container)){throw "Missing source tree: $relative"}
    $base=[IO.Path]::GetFullPath($source).TrimEnd('\')+'\'
    if((Get-Item -LiteralPath $source).Attributes-band[IO.FileAttributes]::ReparsePoint){throw 'Linked source tree.'}
    foreach($item in Get-ChildItem -LiteralPath $source -Recurse -Force){
        if($item.Attributes-band[IO.FileAttributes]::ReparsePoint){throw 'Linked paths are not packaged.'}
        if($item.PSIsContainer){continue}
        if(-not$item.FullName.StartsWith($base,[StringComparison]::OrdinalIgnoreCase)){throw 'Source path escaped package tree.'}
        if($item.Name-match'^\.env|^application-local\.(properties|ya?ml)$' -or $item.Extension-in @('.log','.dll','.bak','.mdf','.ldf','.key','.pfx')){throw "Unexpected private/runtime file in source tree: $relative"}
        Add-File $item.FullName ($relative+'/'+$item.FullName.Substring($base.Length))
    }
}
Add-File (Join-Path $root 'README.md') 'README.md'
Add-File (Join-Path $root '.gitignore') '.gitignore'
foreach($name in @('pom.xml','mvnw','mvnw.cmd','.gitignore')){Add-File (Join-Path $backend $name) ('ecothugom-backend/'+$name)}
foreach($tree in @('.mvn','docs')){Add-Tree (Join-Path $backend $tree) ('ecothugom-backend/'+$tree)}
Add-Tree (Join-Path $backend 'src\main') 'ecothugom-backend/src/main'
Add-Tree (Join-Path $backend 'scripts\sql') 'ecothugom-backend/scripts/sql'
foreach($name in @('start-local.ps1','create-initial-admin.ps1','initialize-demo-db.ps1','package-demo.ps1','migrate-pickup-location.ps1')){Add-File (Join-Path $PSScriptRoot $name) ('ecothugom-backend/scripts/'+$name)}
Add-File $jar 'ecothugom-backend/runtime/ecothugom-backend.jar'
foreach($line in Get-Content -LiteralPath (Join-Path $frontend '.npmrc')){
    if($line.Trim() -and $line-notmatch'^\s*[#;]' -and $line-notmatch'^\s*(fund|audit|engine-strict|save-exact)\s*='){throw 'Review nonstandard .npmrc settings before packaging.'}
}
foreach($name in @('package.json','package-lock.json','index.html','vite.config.js','eslint.config.js','.npmrc','.prettierrc.json','.prettierignore','.gitignore','.env.example')){Add-File (Join-Path $frontend $name) ('Frontend VCoi/'+$name)}
foreach($tree in @('src','public','dist')){Add-Tree (Join-Path $frontend $tree) ('Frontend VCoi/'+$tree)}
$manifest=foreach($name in ($files.Keys|Sort-Object)){(Get-FileHash -LiteralPath $files[$name] -Algorithm SHA256).Hash.ToLowerInvariant()+' *'+$name}
[void][IO.Directory]::CreateDirectory((Split-Path -Parent $archive))
$temporary=$archive+'.'+[guid]::NewGuid().ToString('N')+'.tmp'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
try {
    $stream=[IO.File]::Open($temporary,[IO.FileMode]::CreateNew)
    $zip=New-Object IO.Compression.ZipArchive($stream,[IO.Compression.ZipArchiveMode]::Create,$false)
    try {
        foreach($name in ($files.Keys|Sort-Object)){
            [void][IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip,$files[$name],('VCoi-demo/'+$name),[IO.Compression.CompressionLevel]::Optimal)
        }
        $entry=$zip.CreateEntry('VCoi-demo/MANIFEST.sha256')
        $writer=New-Object IO.StreamWriter($entry.Open(),(New-Object Text.UTF8Encoding($false)))
        try {$writer.Write(($manifest-join"`n")+"`n")}finally{$writer.Dispose()}
    } finally {$zip.Dispose();$stream.Dispose()}
    Move-Item -LiteralPath $temporary -Destination $archive -Force:$Force
    $digest=(Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLowerInvariant()
    [IO.File]::WriteAllText($archive+'.sha256',$digest+' *'+[IO.Path]::GetFileName($archive)+[Environment]::NewLine)
    [pscustomobject]@{Archive=$archive;Files=$files.Count+1;Sha256=$digest;Bytes=(Get-Item -LiteralPath $archive).Length}
} finally {
    if(Test-Path -LiteralPath $temporary){Remove-Item -LiteralPath $temporary -Force}
}
