$ErrorActionPreference = "Stop"
Set-Location "E:\Project Repo\thcms"
$proc = Start-Process -FilePath "E:\Project Repo\thcms\start-server.bat" -WorkingDirectory "E:\Project Repo\thcms" -WindowStyle Hidden -PassThru
Start-Sleep -Seconds 1
Write-Host "Spawned PID: $($proc.Id)"
