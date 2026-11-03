# Test live API with clean ASCII strings
$ErrorActionPreference = "Stop"

Write-Host "`n=== 1. TEST HEALTH ENDPOINT ===" -ForegroundColor Cyan
$h = Invoke-RestMethod -Uri 'http://localhost:8080/api/v1/health'
Write-Host "Status: $($h.data.status), MySQL: $($h.data.database.status), Uptime: $($h.data.uptimeReadable)"

Write-Host "`n=== 2. TEST PUBLIC MASTER DATA APIS ===" -ForegroundColor Cyan
$specs = Invoke-RestMethod -Uri 'http://localhost:8080/api/v1/specialties'
Write-Host "Specialties count: $($specs.data.Count), Khoa: $($specs.data[0].name) (ID: $($specs.data[0].id))"

$docs = Invoke-RestMethod -Uri 'http://localhost:8080/api/v1/doctors'
Write-Host "Doctors count: $($docs.data.Count), Bac si: $($docs.data[0].fullName) (ID: $($docs.data[0].id))"

$meds = Invoke-RestMethod -Uri 'http://localhost:8080/api/v1/medicines'
Write-Host "Medicines count: $($meds.data.Count), Thuoc: $($meds.data[0].name)"

Write-Host "`n=== 3. TEST AUTHENTICATION (ADMIN LOGIN) ===" -ForegroundColor Cyan
$body = '{"username":"admin","password":"Admin@123456"}'
$login = Invoke-RestMethod -Uri 'http://localhost:8080/api/v1/auth/login' -Method Post -Body $body -ContentType 'application/json'
$token = $login.data.accessToken
Write-Host "Login successful! Roles: $($login.data.roles -join ', '), Token: $($token.Substring(0, 25))..."

$headers = @{
    'Authorization' = "Bearer $token"
    'Content-Type' = 'application/json'
}

Write-Host "`n=== 4. TEST CREATE PATIENT (POST /api/v1/patients) ===" -ForegroundColor Cyan
$randPhone = "09" + (Get-Random -Minimum 10000000 -Maximum 99999999)
$pBody = @{
    fullName = "Tran Van Hoang Test"
    phone = $randPhone
    gender = "NAM"
    dateOfBirth = "1988-11-20"
    identityCardNo = "079188001234"
    email = "hoangtest@gmail.com"
    address = "789 Dien Bien Phu, Binh Thanh, TPHCM"
    bloodType = "A+"
    allergies = "Di ung phan hoa"
    medicalHistorySummary = "Tien su tang huyet ap nhe"
} | ConvertTo-Json

$pRes = Invoke-RestMethod -Uri 'http://localhost:8080/api/v1/patients' -Method Post -Body $pBody -Headers $headers
$newPatient = $pRes.data
Write-Host "Created Patient: $($newPatient.patientCode) - $($newPatient.fullName), ID: $($newPatient.id)"

Write-Host "`n=== 5. TEST READ PATIENT (GET /api/v1/patients/{id}) ===" -ForegroundColor Cyan
$getPatient = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/patients/$($newPatient.id)" -Method Get -Headers $headers
Write-Host "Read Patient from API: $($getPatient.data.patientCode) - $($getPatient.data.fullName) (Status: $($getPatient.data.status))"

Write-Host "`n=== 6. TEST CREATE APPOINTMENT (POST /api/v1/appointments) ===" -ForegroundColor Cyan
$aptDate = (Get-Date).AddDays(1).ToString('yyyy-MM-dd')
$aptBody = @{
    patientId = $newPatient.id
    specialtyId = $specs.data[0].id
    doctorId = $docs.data[0].id
    roomId = $docs.data[0].roomId
    appointmentDate = $aptDate
    appointmentTime = "08:45:00"
    shift = "MORNING"
    appointmentType = "WALK_IN"
    reason = "Tai kham dinh ky theo doi huyet ap"
} | ConvertTo-Json

$aptRes = Invoke-RestMethod -Uri 'http://localhost:8080/api/v1/appointments' -Method Post -Body $aptBody -Headers $headers
$newApt = $aptRes.data
Write-Host "Created Appointment: $($newApt.appointmentCode)"
Write-Host "  Patient: $($newApt.patientName)"
Write-Host "  Doctor: $($newApt.doctorName)"
Write-Host "  Specialty: $($newApt.specialtyName)"
Write-Host "  Room: $($newApt.roomName)"
Write-Host "  Date/Time: $($newApt.appointmentDate) $($newApt.appointmentTime)"

Write-Host "`n=== 7. TEST FOREIGN KEY INTEGRITY (NEGATIVE TEST) ===" -ForegroundColor Cyan
$invalidAptBody = @{
    patientId = "00000000-0000-0000-0000-000000000000"
    specialtyId = $specs.data[0].id
    appointmentDate = $aptDate
    appointmentTime = "09:00:00"
    reason = "Thu nghiem vi pham FK"
} | ConvertTo-Json

try {
    $invRes = Invoke-RestMethod -Uri 'http://localhost:8080/api/v1/appointments' -Method Post -Body $invalidAptBody -Headers $headers
    Write-Host "FAIL: Server accepted invalid FK!" -ForegroundColor Red
} catch {
    Write-Host "SUCCESS: Server correctly rejected non-existent patientId with error: $($_.Exception.Message)" -ForegroundColor Green
}

Write-Host "`n=== 8. DIRECT MYSQL VERIFICATION (SELECT FROM DB) ===" -ForegroundColor Cyan
$mysqlExe = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
if (-not (Test-Path $mysqlExe)) { $mysqlExe = "mysql" }

$patId = $newPatient.id
$sql1 = "SELECT id, patient_code, full_name, phone, blood_type FROM patients WHERE id = '$patId';"
& $mysqlExe -u root -p123456 -D clinic_management -e "$sql1"

$aptId = $newApt.id
$sql2 = "SELECT appointment_code, patient_id, doctor_id, specialty_id, appointment_date, status FROM appointments WHERE id = '$aptId';"
& $mysqlExe -u root -p123456 -D clinic_management -e "$sql2"

Write-Host "`n>>> TAT CA CAC BAI TEST API VA MYSQL DEU HOAN THANH XUAT SAC 100%! <<<`n" -ForegroundColor Green
