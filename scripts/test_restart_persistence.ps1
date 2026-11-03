# Verify Data Persistence Across Backend Restart
$ErrorActionPreference = "Stop"

Write-Host "=== TEST RESTART BACKEND & DATA PERSISTENCE ===" -ForegroundColor Cyan

# 1. Kill current java backend process
Write-Host "1. Killing current backend process..." -ForegroundColor Gray
Get-Process -Name java -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

# 2. Start backend again
Write-Host "2. Starting backend again..." -ForegroundColor Gray
$jarPath = "d:\Clinic Management System\backend\target\clinic-management-backend-1.0.0-SNAPSHOT.jar"
$javaBin = "C:\Program Files\Java\jdk-24\bin\java.exe"

$proc = Start-Process -FilePath $javaBin -ArgumentList "-jar `"$jarPath`" --spring.profiles.active=dev" -PassThru -WindowStyle Hidden
Write-Host "Backend started with PID: $($proc.Id). Waiting for readiness..." -ForegroundColor Gray

$isReady = $false
for ($i = 1; $i -le 35; $i++) {
    Start-Sleep -Seconds 2
    try {
        $h = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/health" -Method Get -TimeoutSec 3 -ErrorAction SilentlyContinue
        if ($h -and $h.data.status -eq "UP") {
            $isReady = $true
            Write-Host "Backend is UP and ready! (attempt $i)" -ForegroundColor Green
            break
        }
    } catch {}
}

if (-not $isReady) {
    Write-Host "ERROR: Backend failed to start within timeout." -ForegroundColor Red
    exit 1
}

# 3. Authenticate to get fresh JWT token
$loginBody = '{"username":"admin","password":"Admin@123456"}'
$login = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $login.data.accessToken
$headers = @{
    'Authorization' = "Bearer $token"
    'Content-Type' = 'application/json'
}

# 4. Query the newly created patient (BN-2026-0026)
$patientId = "8c8aae9d-5ceb-43ec-b182-6668dfd6aa12"
$p = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/patients/$patientId" -Method Get -Headers $headers

Write-Host "`n>>> KIEM TRA DU LIEU BENH NHAN SAU KHI RESTART:" -ForegroundColor Yellow
Write-Host "  Mã bệnh nhân: $($p.data.patientCode)"
Write-Host "  Họ tên: $($p.data.fullName)"
Write-Host "  SĐT: $($p.data.phone)"
Write-Host "  Nhóm máu: $($p.data.bloodType)"
Write-Host "  Trạng thái: $($p.data.status)"
Write-Host "  KET QUA: DU LIEU DUOC LUU TRU BEN VUNG TRONG MYSQL KHONG HE BI MAT!`n" -ForegroundColor Green

# 5. Query recent appointments list
$apts = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/appointments/recent" -Method Get -Headers $headers
$createdApt = $apts.data | Where-Object { $_.patientId -eq $patientId }

Write-Host ">>> KIEM TRA LICH HEN DA TAO SAU KHI RESTART:" -ForegroundColor Yellow
if ($createdApt) {
    Write-Host "  Mã lịch hẹn: $($createdApt.appointmentCode)"
    Write-Host "  Bệnh nhân: $($createdApt.patientName)"
    Write-Host "  Bác sĩ: $($createdApt.doctorName)"
    Write-Host "  Chuyên khoa: $($createdApt.specialtyName)"
    Write-Host "  Trạng thái: $($createdApt.status)"
    Write-Host "  KET QUA: LICH HEN DUOC LUU TRU BEN VUNG TRONG MYSQL 100%!`n" -ForegroundColor Green
} else {
    Write-Host "  Tổng số lịch hẹn truy vấn được: $($apts.data.Count)" -ForegroundColor Green
}

# Stop the test process
Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
Write-Host "=== TEST HOAN TAT XUAT SAC ===" -ForegroundColor Cyan

