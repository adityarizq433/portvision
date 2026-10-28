# ============================================================
#  Alat ukur delay deteksi port (cabut-colok) - Portvision
#  Jalankan:  .\measure-delay.ps1
#  Lalu cabut/colok kabel, catat waktu yang tercetak.
#  Ctrl+C untuk berhenti.
# ============================================================
$portNames = @('fa22', 'fa23')
$prev = @{}

Write-Host ""
Write-Host ">> Memantau status port via Redis (sumber data web)..." -ForegroundColor Yellow
Write-Host ">> Cabut/colok kabel saat kamu melihat waktu di bawah -" -ForegroundColor Yellow
Write-Host ">> catat jam itu sebagai 'jam cabut/colok'." -ForegroundColor Yellow
Write-Host ">> Baris 'BERUBAH' = jam web mendeteksi. Delay = selisihnya." -ForegroundColor Yellow
Write-Host ""

while ($true) {
    $j = docker exec portvision_redis redis-cli --raw get portvision-database-device:2:ports 2>$null
    if ($LASTEXITCODE -ne 0 -or -not $j) {
        Start-Sleep -Seconds 2
        continue
    }

    $t = Get-Date -Format 'HH:mm:ss'
    $ports = $j | ConvertFrom-Json

    foreach ($name in $portNames) {
        $p = $ports | Where-Object if_name -eq $name
        if (-not $p) { continue }
        $s = $p.oper_status
        if (-not $prev.ContainsKey($name)) {
            $prev[$name] = $s
            Write-Host "$t  $name : $s (awal)" -ForegroundColor Gray
        }
        elseif ($prev[$name] -ne $s) {
            Write-Host "$t  $name : $($prev[$name]) -> $s   <<< BERUBAH" -ForegroundColor Cyan
            $prev[$name] = $s
        }
    }

    # heartbeat: jam jalan tiap 2 detik sebagai acuan waktu cabut/colok
    if ((Get-Date).Second % 2 -eq 0) {
        Write-Host "$t  ... menunggu perubahan" -ForegroundColor DarkGray
    }

    Start-Sleep -Seconds 1
}
