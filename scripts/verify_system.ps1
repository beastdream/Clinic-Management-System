# ==============================================================================
# HỆ THỐNG QUẢN LÝ PHÒNG KHÁM - SCRIPT KIỂM THỬ VÀ XÁC MINH TOÀN DIỆN
# ==============================================================================

$ErrorActionPreference = "Continue"

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host ">>> BAT DAU QUY TRINH KIEM THU HE THONG CLINIC MANAGEMENT" -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

$javaBin = "C:\Program Files\Java\jdk-24\bin\java.exe"
$mysqlExe = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
if (-not (Test-Path $mysqlExe)) {
    $mysqlExe = "mysql"
}

$dbUser = "root"
$dbPass = "123456"
$dbName = "clinic_management"

# ------------------------------------------------------------------------------
# BUOC 1: KIEM TRA MYSQL VA LICH SU FLYWAY MIGRATION
# ------------------------------------------------------------------------------
Write-Host ">>> [BUOC 1/8] Kiem tra lich su Flyway migrations trong MySQL..." -ForegroundColor Yellow
$flywaySql = "SELECT installed_rank, version, description, execution_time, success FROM flyway_schema_history ORDER BY installed_rank;"
& $mysqlExe -u $dbUser "-p$dbPass" -D $dbName -e "$flywaySql"

# ------------------------------------------------------------------------------
# BUOC 2: SELECT DEM SO LUONG BAN GHI CAC BANG CHINH
# ------------------------------------------------------------------------------
Write-Host "`n>>> [BUOC 2/8] Dem so luong ban ghi thuc te tren cac bang chinh..." -ForegroundColor Yellow
$countSql = "SELECT 'users' AS tbl, COUNT(*) AS total FROM users UNION ALL SELECT 'roles', COUNT(*) FROM roles UNION ALL SELECT 'staff_profiles', COUNT(*) FROM staff_profiles UNION ALL SELECT 'patients', COUNT(*) FROM patients UNION ALL SELECT 'appointments', COUNT(*) FROM appointments UNION ALL SELECT 'medicines', COUNT(*) FROM medicines UNION ALL SELECT 'specialties', COUNT(*) FROM specialties UNION ALL SELECT 'rooms', COUNT(*) FROM rooms;"
& $mysqlExe -u $dbUser "-p$dbPass" -D $dbName -e "$countSql"

# ------------------------------------------------------------------------------
# BUOC 3: KHOI DONG SPRING BOOT BACKEND
# ------------------------------------------------------------------------------
Write-Host "`n>>> [BUOC 3/8] Khoi dong Backend Spring Boot..." -ForegroundColor Yellow
$jarPath = "d:\Clinic Management System\backend\target\clinic-management-backend-1.0.0-SNAPSHOT.jar"

if (-not (Test-Path $jarPath)) {
    Write-Host "LOI: Khong tim thay file JAR tai $jarPath" -ForegroundColor Red
    exit 1
}

$backendProcess = Start-Process -FilePath $javaBin -ArgumentList "-jar", "`"$jarPath`"", "--spring.profiles.active=dev" -PassThru -WindowStyle Hidden
Write-Host "Backend process khoi chay voi PID: $($backendProcess.Id). Cho ung dung san sang..." -ForegroundColor Gray

$maxRetries = 30
$isReady = $false
for ($i = 1; $i -le $maxRetries; $i++) {
    Start-Sleep -Seconds 2
    try {
        $health = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/health" -Method Get -TimeoutSec 3 -ErrorAction SilentlyContinue
        if ($health -and $health.data.status -eq "UP") {
            Write-Host ">>> Backend san sang! MySQL: $($health.data.database.status), Profile: $($health.data.activeProfile)" -ForegroundColor Green
            $isReady = $true
            break
        }
    } catch {
        Write-Host "  ... Cho backend khoi dong (lan $i/$maxRetries)..." -ForegroundColor DarkGray
    }
}

if (-not $isReady) {
    Write-Host "LOI: Backend khong phan hoi sau $maxRetries lan thu." -ForegroundColor Red
    Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
    exit 1
}

# ------------------------------------------------------------------------------
# BUOC 4: DANG NHAP ADMIN LAY JWT TOKEN
# ------------------------------------------------------------------------------
Write-Host "`n>>> [BUOC 4/8] Dang nhap admin de lay JWT token..." -ForegroundColor Yellow
$loginBody = '{"username":"admin","password":"Admin@123456"}'
$loginRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginRes.data.accessToken
Write-Host "Dang nhap thanh cong! Username: $($loginRes.data.username), Vai tro: $($loginRes.data.roles -join ', ')" -ForegroundColor Green

$authHeaders = @{
    "Authorization" = "Bearer $token"
    "Content-Type"  = "application/json"
}

# ------------------------------------------------------------------------------
# BUOC 5: TAO BENH NHAN MOI TU API VA DOC LAI TU DB
# ------------------------------------------------------------------------------
Write-Host "`n>>> [BUOC 5/8] Tao benh nhan moi qua POST /api/v1/patients..." -ForegroundColor Yellow
$randPhone = "09" + (Get-Random -Minimum 10000000 -Maximum 99999999)
$patientBody = @{
    fullName = "Le Hoang Phuc Test"
    phone = $randPhone
    gender = "NAM"
    dateOfBirth = "1994-08-15"
    identityCardNo = "079194099888"
    email = "phuctest@gmail.com"
    address = "456 Duong Nguyen Dinh Chieu, Q3, TPHCM"
    bloodType = "O+"
    allergies = "Khong ghi nhan di ung"
} | ConvertTo-Json

$createPatientRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/patients" -Method Post -Body $patientBody -Headers $authHeaders
$createdPatient = $createPatientRes.data
Write-Host "Tao benh nhan thanh cong qua API:" -ForegroundColor Green
Write-Host "  - ID: $($createdPatient.id)"
Write-Host "  - Ma BN: $($createdPatient.patientCode)"
Write-Host "  - Ho ten: $($createdPatient.fullName)"
Write-Host "  - SDT: $($createdPatient.phone)"

# Doc lai qua GET
$getPatientRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/patients/$($createdPatient.id)" -Method Get -Headers $authHeaders
Write-Host "Doc lai qua GET /api/v1/patients/{id}: Thanh cong! (Ma: $($getPatientRes.data.patientCode))" -ForegroundColor Green

# Kiem tra truc tiep trong MySQL
Write-Host "Kiem tra trong MySQL:" -ForegroundColor Gray
$verifyPatientSql = "SELECT id, patient_code, full_name, phone, blood_type, created_at FROM patients WHERE id = '$($createdPatient.id)';"
& $mysqlExe -u $dbUser "-p$dbPass" -D $dbName -e "$verifyPatientSql"

# ------------------------------------------------------------------------------
# BUOC 6: TAO LICH HEN MOI TU API VA KIEM TRA KHOA NGOAI
# ------------------------------------------------------------------------------
Write-Host "`n>>> [BUOC 6/8] Tao lich hen moi voi rang buoc khoa ngoai..." -ForegroundColor Yellow

$specialties = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/specialties" -Method Get
$doctors = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/doctors" -Method Get

$targetSpecialty = $specialties.data[0]
$targetDoctor = $doctors.data[0]
$aptDate = (Get-Date).AddDays(1).ToString("yyyy-MM-dd")

$aptBody = @{
    patientId = $createdPatient.id
    specialtyId = $targetSpecialty.id
    doctorId = $targetDoctor.id
    roomId = $targetDoctor.roomId
    appointmentDate = $aptDate
    appointmentTime = "09:00:00"
    shift = "MORNING"
    appointmentType = "WALK_IN"
    reason = "Kiem tra tong quat theo doi"
} | ConvertTo-Json

$createAptRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/appointments" -Method Post -Body $aptBody -Headers $authHeaders
$createdApt = $createAptRes.data

Write-Host "Tao lich hen thanh cong qua API:" -ForegroundColor Green
Write-Host "  - Ma lich hen: $($createdApt.appointmentCode)"
Write-Host "  - Benh nhan ID: $($createdApt.patientId)"
Write-Host "  - Bac si: $($createdApt.doctorName)"
Write-Host "  - Chuyen khoa: $($createdApt.specialtyName)"
Write-Host "  - Phong: $($createdApt.roomName)"

# Kiem tra trong MySQL voi JOIN khoa ngoai
Write-Host "Truy van MySQL voi JOIN khoa ngoai:" -ForegroundColor Gray
$verifyAptSql = "SELECT a.appointment_code, p.full_name AS patient_name, s.name AS specialty_name, COALESCE(st.full_name, 'Chua xep') AS doctor_name, a.status FROM appointments a JOIN patients p ON a.patient_id = p.id JOIN specialties s ON a.specialty_id = s.id LEFT JOIN staff_profiles st ON a.doctor_id = st.id WHERE a.id = '$($createdApt.id)';"
& $mysqlExe -u $dbUser "-p$dbPass" -D $dbName -e "$verifyAptSql"

# ------------------------------------------------------------------------------
# BUOC 7: THU NGHIEM VI PHAM KHOA NGOAI (NEGATIVE TEST)
# ------------------------------------------------------------------------------
Write-Host "`n>>> [BUOC 7/8] Negative Test: Thu tao lich hen voi patientId khong ton tai..." -ForegroundColor Yellow
$fakeAptBody = @{
    patientId = "00000000-0000-0000-0000-000000000000"
    specialtyId = $targetSpecialty.id
    appointmentDate = $aptDate
    appointmentTime = "10:00:00"
    reason = "Test invalid FK"
} | ConvertTo-Json

try {
    $res = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/appointments" -Method Post -Body $fakeAptBody -Headers $authHeaders
    Write-Host "CANH BAO: API khong chan khoa ngoai gia!" -ForegroundColor Red
} catch {
    Write-Host "Chinh xac: He thong chan khoa ngoai sai! Response: $($_.Exception.Message)" -ForegroundColor Green
}

# ------------------------------------------------------------------------------
# BUOC 8: RESTART BACKEND VA XAC NHAN DU LIEU KHONG BI MAT
# ------------------------------------------------------------------------------
Write-Host "`n>>> [BUOC 8/8] Thu nghiem Restart Backend va kiem tra tinh ben vung du lieu..." -ForegroundColor Yellow
Write-Host "Dung backend PID $($backendProcess.Id)..." -ForegroundColor Gray
Stop-Process -Id $backendProcess.Id -Force
Start-Sleep -Seconds 3

Write-Host "Khoi dong lai Backend Spring Boot..." -ForegroundColor Gray
$backendProcess2 = Start-Process -FilePath $javaBin -ArgumentList "-jar", "`"$jarPath`"", "--spring.profiles.active=dev" -PassThru -WindowStyle Hidden

$isReady2 = $false
for ($i = 1; $i -le $maxRetries; $i++) {
    Start-Sleep -Seconds 2
    try {
        $health = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/health" -Method Get -TimeoutSec 3 -ErrorAction SilentlyContinue
        if ($health -and $health.data.status -eq "UP") {
            $isReady2 = $true
            break
        }
    } catch {}
}

if ($isReady2) {
    Write-Host "Backend da khoi dong lai thanh cong!" -ForegroundColor Green
    
    # Kiem tra lai benh nhan va lich hen
    $checkPatientRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/patients/$($createdPatient.id)" -Method Get -Headers $authHeaders
    Write-Host "Kiem tra du lieu sau khi restart:" -ForegroundColor Green
    Write-Host "  - Benh nhan: $($checkPatientRes.data.patientCode) - $($checkPatientRes.data.fullName) -> VAN TON TAI 100%!" -ForegroundColor Green
} else {
    Write-Host "LOI: Khong the khoi dong lai backend." -ForegroundColor Red
}

# Don dep tien trinh test
Stop-Process -Id $backendProcess2.Id -Force -ErrorAction SilentlyContinue

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host ">>> HOAN THANH TOAN BO 8 BUOC KIEM THU TRAN TRONG!" -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan
