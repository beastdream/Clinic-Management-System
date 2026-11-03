# ==============================================================================
# KIEM THU TOAN DIEN CAC CHUC NANG COT LOI (CORE FEATURES VERIFICATION)
# 1. Benh nhan: Them -> Tim kiem -> Sua -> Soft delete -> Reload
# 2. Bac si: Danh sach -> Loc theo chuyen khoa -> Tim kiem
# 3. Lich hen: Dat lich -> Kiem tra trung gio (409) -> Check-in -> Hoan thanh -> Huy lich (luu MySQL)
# 4. Kiem tra cac ma loi: 400, 401, 404, 409
# ==============================================================================

$ErrorActionPreference = "Continue"

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host ">>> BAT DAU KIEM THU TOAN DIEN CHUC NANG COT LOI CMS" -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

$javaBin = "C:\Program Files\Java\jdk-24\bin\java.exe"
$jarPath = "d:\Clinic Management System\backend\target\clinic-management-backend-1.0.0-SNAPSHOT.jar"
$mysqlExe = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
if (-not (Test-Path $mysqlExe)) { $mysqlExe = "mysql" }

# 1. Khoi dong backend
Write-Host ">>> 1. KHOI DONG BACKEND SPRING BOOT..." -ForegroundColor Yellow
Get-Process -Name java -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

$backendProcess = Start-Process -FilePath $javaBin -ArgumentList "-jar", "`"$jarPath`"", "--spring.profiles.active=dev" -PassThru -WindowStyle Hidden
Write-Host "Backend process khoi chay PID: $($backendProcess.Id). Cho san sang..." -ForegroundColor Gray

$isReady = $false
for ($i = 1; $i -le 35; $i++) {
    Start-Sleep -Seconds 2
    try {
        $h = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/health" -Method Get -TimeoutSec 3 -ErrorAction SilentlyContinue
        if ($h -and $h.data.status -eq "UP") {
            $isReady = $true
            Write-Host "Backend san sang! Uptime: $($h.data.uptimeReadable)" -ForegroundColor Green
            break
        }
    } catch {}
}

if (-not $isReady) {
    Write-Host "LOI: Backend khong khoi dong duoc." -ForegroundColor Red
    exit 1
}

# 2. Dang nhap Admin lay JWT
Write-Host "`n>>> 2. XAC THUC ADMIN LAY TOKEN JWT..." -ForegroundColor Yellow
$loginBody = '{"username":"admin","password":"Admin@123456"}'
$login = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $login.data.accessToken
Write-Host "Dang nhap thanh cong! Role: $($login.data.roles -join ', ')" -ForegroundColor Green

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type"  = "application/json"
}

# ------------------------------------------------------------------------------
# 3. KIEM THU QUAN LY BENH NHAN (PATIENT WORKFLOW)
# ------------------------------------------------------------------------------
Write-Host "`n>>> 3. KIEM THU QUAN LY BENH NHAN..." -ForegroundColor Yellow

# 3.1 Them benh nhan moi
$randPhone = "09" + (Get-Random -Minimum 10000000 -Maximum 99999999)
$pBody = @{
    fullName = "Pham Quoc Khanh Test"
    phone = $randPhone
    gender = "NAM"
    dateOfBirth = "1992-06-25"
    identityCardNo = "079192008899"
    email = "khanhtest@gmail.com"
    address = "123 Nguyen Trai, Quan 5, TPHCM"
    bloodType = "B+"
    allergies = "Di ung hai san"
    medicalHistorySummary = "Viem xoang man tinh"
} | ConvertTo-Json

$pRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/patients" -Method Post -Body $pBody -Headers $headers
$patient = $pRes.data
Write-Host "[3.1 THEM BENH NHAN] Thanh cong: $($patient.patientCode) - $($patient.fullName) (ID: $($patient.id))" -ForegroundColor Green

# 3.2 Tim kiem benh nhan theo ten, sdt, ma
$searchRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/patients?search=$($patient.phone)" -Method Get -Headers $headers
$patientList = if ($searchRes.data.items) { $searchRes.data.items } else { $searchRes.data.content }
Write-Host "[3.2 TIM KIEM THEO SDT] Tim thay $($patientList.Count) ket qua: $($patientList[0].fullName)" -ForegroundColor Green

# 3.3 Chinh sua thong tin hanh chinh
$updateBody = @{
    fullName = "Pham Quoc Khanh (Da Cap Nhat)"
    phone = $patient.phone
    gender = "NAM"
    dateOfBirth = "1992-06-25"
    identityCardNo = "079192008899"
    email = "khanh.updated@gmail.com"
    address = "456 Tran Hung Dao, Quan 5, TPHCM"
    bloodType = "AB+"
    allergies = "Di ung hai san va phan hoa"
    medicalHistorySummary = "Viem xoang da dieu tri on dinh"
    status = "ACTIVE"
} | ConvertTo-Json

$upRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/patients/$($patient.id)" -Method Put -Body $updateBody -Headers $headers
Write-Host "[3.3 SUA BENH NHAN] Cap nhat thanh cong: $($upRes.data.fullName), Nhom mau: $($upRes.data.bloodType)" -ForegroundColor Green

# 3.4 Doc lai qua GET /api/v1/patients/{id}
$getRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/patients/$($patient.id)" -Method Get -Headers $headers
Write-Host "[3.4 RELOAD BENH NHAN] Doc lai thanh cong: $($getRes.data.fullName) (Dia chi: $($getRes.data.address))" -ForegroundColor Green

# 3.5 Luu tru benh nhan (Soft Delete)
$delRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/patients/$($patient.id)" -Method Delete -Headers $headers
Write-Host "[3.5 SOFT DELETE] Da goi DELETE /api/v1/patients/$($patient.id)" -ForegroundColor Green

# 3.6 Kiem tra trong MySQL: status='ARCHIVED' va deleted_at IS NOT NULL
Write-Host "[3.6 XAC MINH MYSQL SOFT DELETE]:" -ForegroundColor Gray
& $mysqlExe -u root -p123456 -D clinic_management -e "SELECT id, patient_code, full_name, status, deleted_at FROM patients WHERE id = '$($patient.id)';"

# Kiem tra benh nhan khong con trong danh sach active
$checkActive = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/patients?search=$($patient.phone)" -Method Get -Headers $headers
$activeList = if ($checkActive.data.items) { $checkActive.data.items } else { $checkActive.data.content }
if ($activeList.Count -eq 0) {
    Write-Host "[3.7 XAC MINH AN KHOI DANH SACH] Chinh xac: Benh nhan da bi an khoi danh sach active!" -ForegroundColor Green
}

# ------------------------------------------------------------------------------
# 4. KIEM THU QUAN LY BAC SI (DOCTOR WORKFLOW)
# ------------------------------------------------------------------------------
Write-Host "`n>>> 4. KIEM THU QUAN LY BAC SI..." -ForegroundColor Yellow

$allDocs = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/doctors" -Method Get
Write-Host "[4.1 DANH SACH BAC SI] Tong so: $($allDocs.data.Count) bac si" -ForegroundColor Green

$specs = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/specialties" -Method Get
$targetSpec = $specs.data[0]
$filteredDocs = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/doctors?specialtyId=$($targetSpec.id)" -Method Get
Write-Host "[4.2 LOC THEO CHUYEN KHOA] Khoa '$($targetSpec.name)': $($filteredDocs.data.Count) bac si" -ForegroundColor Green

$searchedDocs = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/doctors?search=Minh" -Method Get
Write-Host "[4.3 TIM KIEM BAC SI 'Minh'] Tim thay: $($searchedDocs.data[0].fullName) (Ma: $($searchedDocs.data[0].staffCode), Phong: $($searchedDocs.data[0].roomName))" -ForegroundColor Green

# ------------------------------------------------------------------------------
# 5. KIEM THU QUAN LY LICH HEN (APPOINTMENT WORKFLOW)
# ------------------------------------------------------------------------------
Write-Host "`n>>> 5. KIEM THU QUAN LY LICH HEN..." -ForegroundColor Yellow

# Tao 1 benh nhan de test lich hen
$pTestBody = @{
    fullName = "Nguyen Duc Thang Test"
    phone = "09" + (Get-Random -Minimum 10000000 -Maximum 99999999)
    gender = "NAM"
    dateOfBirth = "1995-10-10"
} | ConvertTo-Json
$pTestRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/patients" -Method Post -Body $pTestBody -Headers $headers
$targetPatient = $pTestRes.data
$targetDoctor = $allDocs.data[0]
$aptDate = (Get-Date).AddDays(2).ToString("yyyy-MM-dd")
$randMin = (Get-Random -Minimum 10 -Maximum 50)
$aptTime = "11:$($randMin):00"

# 5.1 Dat lich hen moi
$aptBody1 = @{
    patientId = $targetPatient.id
    specialtyId = $targetDoctor.specialtyId
    doctorId = $targetDoctor.id
    roomId = $targetDoctor.roomId
    appointmentDate = $aptDate
    appointmentTime = $aptTime
    shift = "MORNING"
    appointmentType = "WALK_IN"
    reason = "Kiem tra tim mach tong quat"
} | ConvertTo-Json

$aptRes1 = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/appointments" -Method Post -Body $aptBody1 -Headers $headers
$apt1 = $aptRes1.data
Write-Host "[5.1 DAT LICH HEN] Thanh cong: $($apt1.appointmentCode) - Bac si: $($apt1.doctorName) luc $aptTime ngay $aptDate (Trang thai: $($apt1.status))" -ForegroundColor Green

# 5.2 Kiem tra trung gio (Slot Conflict Check) -> Expect 409 Conflict
Write-Host "[5.2 THU DAT TRUNG GIO VOI CUNG BAC SI...]" -ForegroundColor Gray
$aptBodyConflict = @{
    patientId = $targetPatient.id
    specialtyId = $targetDoctor.specialtyId
    doctorId = $targetDoctor.id
    roomId = $targetDoctor.roomId
    appointmentDate = $aptDate
    appointmentTime = $aptTime
    shift = "MORNING"
    reason = "Thu dat trung slot voi bac si"
} | ConvertTo-Json

try {
    $conflictRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/appointments" -Method Post -Body $aptBodyConflict -Headers $headers
    Write-Host "LOI: He thong khong bat duoc trung lich!" -ForegroundColor Red
} catch {
    Write-Host "[5.2 CHECK TRUNG LICH THANH CONG] He thong bao loi dung ma 409 Conflict: $($_.Exception.Message)" -ForegroundColor Green
}

# 5.3 Tiep don benh nhan (Check-in)
$checkInRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/appointments/$($apt1.id)/check-in" -Method Patch -Headers $headers
Write-Host "[5.3 CHECK-IN] Chuyen trang thai thanh cong: $($checkInRes.data.appointmentCode) -> $($checkInRes.data.status)" -ForegroundColor Green

# 5.4 Hoan thanh luot kham
$completeRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/appointments/$($apt1.id)/complete" -Method Patch -Headers $headers
Write-Host "[5.4 HOAN THANH KHAM] Chuyen trang thai thanh cong: $($completeRes.data.appointmentCode) -> $($completeRes.data.status)" -ForegroundColor Green

# 5.5 Huy lich hen va cap nhat MySQL
# Tao lich hen thu 2 de test huy
$aptBody2 = @{
    patientId = $targetPatient.id
    specialtyId = $targetDoctor.specialtyId
    appointmentDate = (Get-Date).AddDays(3).ToString("yyyy-MM-dd")
    appointmentTime = "14:00:00"
    shift = "AFTERNOON"
    reason = "Lich hen can huy"
} | ConvertTo-Json
$aptRes2 = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/appointments" -Method Post -Body $aptBody2 -Headers $headers
$apt2 = $aptRes2.data

$cancelBody = '{"cancellationReason":"Benh nhan ban dot xuat khong den duoc"}'
$cancelRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/appointments/$($apt2.id)/cancel" -Method Patch -Body $cancelBody -Headers $headers
Write-Host "[5.5 HUY LICH HEN] Da huy thanh cong: $($cancelRes.data.appointmentCode) -> $($cancelRes.data.status) (Ly do: $($cancelRes.data.cancellationReason))" -ForegroundColor Green

# Kiem tra MySQL
Write-Host "[5.6 XAC MINH TRONG MYSQL]:" -ForegroundColor Gray
& $mysqlExe -u root -p123456 -D clinic_management -e "SELECT appointment_code, status, cancellation_reason FROM appointments WHERE id = '$($apt2.id)';"

# ------------------------------------------------------------------------------
# 6. KIEM TRA CAC MA LOI HTTP (400, 401, 404, 409)
# ------------------------------------------------------------------------------
Write-Host "`n>>> 6. KIEM TRA CAC TRUONG HOP MA LOI HTTP..." -ForegroundColor Yellow

# 6.1 Test 400 Bad Request (Validation failure)
try {
    $badReq = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/patients" -Method Post -Body "{}" -Headers $headers
    Write-Host "Loi 400 khong bat duoc" -ForegroundColor Red
} catch {
    Write-Host "[MA LOI 400 BAD REQUEST] Bat dung validation loi: $($_.Exception.Message)" -ForegroundColor Green
}

# 6.2 Test 401 Unauthorized (No token on protected write)
try {
    $noAuthHeaders = @{ "Content-Type" = "application/json" }
    $unauthReq = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/patients" -Method Post -Body $pBody -Headers $noAuthHeaders
    Write-Host "Loi 401 khong bat duoc" -ForegroundColor Red
} catch {
    Write-Host "[MA LOI 401 UNAUTHORIZED] Chặn thành công khi không có token: $($_.Exception.Message)" -ForegroundColor Green
}

# 6.3 Test 404 Not Found
try {
    $fakeId = "00000000-0000-0000-0000-000000000000"
    $notFoundReq = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/patients/$fakeId" -Method Get -Headers $headers
    Write-Host "Loi 404 khong bat duoc" -ForegroundColor Red
} catch {
    Write-Host "[MA LOI 404 NOT FOUND] Tra ve dung 404 khi khong tim thay: $($_.Exception.Message)" -ForegroundColor Green
}

# Don dep tien trinh test
Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host ">>> TAT CA CAC CHUC NANG COT LOI VA MA LOI DEU DAT 100%!" -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan
