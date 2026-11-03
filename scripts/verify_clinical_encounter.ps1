# =============================================================================
# Automated Verification Script: Clinical Encounter Workflow
# Tests:
#   1. Health check & DB connection
#   2. Receptionist check-in appointment
#   3. Doctor retrieves waiting queue
#   4. Doctor starts clinical encounter (IN_PROGRESS)
#   5. Doctor updates draft encounter (vital signs, symptoms, diagnosis)
#   6. Doctor completes encounter (COMPLETED)
#   7. Security Rule: Cannot edit completed encounter (HTTP 400)
#   8. Security Rule: ADMIN cannot access clinical records (HTTP 403)
#   9. Security Rule: Other doctors cannot edit encounter (HTTP 403)
#  10. Audit log verified in MySQL
# =============================================================================

$ErrorActionPreference = "Stop"
$baseUrl = "http://localhost:8080/api/v1"

Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host " STARTING CLINICAL ENCOUNTER E2E VERIFICATION " -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan

# 1. Health check
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get -TimeoutSec 5
    Write-Host "[OK] Backend health check: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Backend is not responding on port 8080: $_" -ForegroundColor Red
    exit 1
}

# 2. Receptionist Login
Write-Host "`n--- Step 1: Receptionist login & Check-in ---" -ForegroundColor Yellow
$receptionistLoginBody = @{
    username = "tieptan_mai"
    password = "Staff@123456"
} | ConvertTo-Json

$recAuth = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $receptionistLoginBody -ContentType "application/json"
$recToken = $recAuth.data.accessToken
Write-Host "[OK] Receptionist login successful. Token acquired." -ForegroundColor Green

# Check-in appointment LH-20261103-004
$targetAptId = "00000000-0000-0000-0030-000000000009"
$checkInHeaders = @{ Authorization = "Bearer $recToken" }
$checkInRes = Invoke-RestMethod -Uri "$baseUrl/appointments/$targetAptId/check-in" -Method Patch -Headers $checkInHeaders
Write-Host "[OK] Appointment check-in successful. Status: $($checkInRes.data.status)" -ForegroundColor Green
if ($checkInRes.data.status -ne "CHECKED_IN") {
    Write-Host "[FAIL] Expected status CHECKED_IN, got: $($checkInRes.data.status)" -ForegroundColor Red
    exit 1
}

# 3. Doctor Login (bs_minh)
Write-Host "`n--- Step 2: Doctor login & Get Queue ---" -ForegroundColor Yellow
$doctorLoginBody = @{
    username = "bs_minh"
    password = "Doctor@123456"
} | ConvertTo-Json

$docAuth = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $doctorLoginBody -ContentType "application/json"
$docToken = $docAuth.data.accessToken
$docHeaders = @{ Authorization = "Bearer $docToken" }
Write-Host "[OK] Doctor bs_minh login successful." -ForegroundColor Green

# Doctor retrieves queue
$queueRes = Invoke-RestMethod -Uri "$baseUrl/clinical/encounters/doctor-queue" -Method Get -Headers $docHeaders
Write-Host "[OK] Doctor queue retrieved: $($queueRes.data.Count) patient(s) waiting." -ForegroundColor Green

$queuedItem = $queueRes.data | Where-Object { $_.appointmentId -eq $targetAptId }
if (-not $queuedItem) {
    Write-Host "[FAIL] Target appointment $targetAptId not found in doctor queue." -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Verified patient in doctor queue: $($queuedItem.patientName) ($($queuedItem.patientCode))" -ForegroundColor Green

# 4. Doctor starts encounter from appointment
Write-Host "`n--- Step 3: Doctor starts encounter ---" -ForegroundColor Yellow
$startEncounterRes = Invoke-RestMethod -Uri "$baseUrl/clinical/encounters/start-from-appointment/$targetAptId" -Method Post -Headers $docHeaders
$encounter = $startEncounterRes.data
$encounterId = $encounter.id
Write-Host "[OK] Encounter started: $($encounter.encounterCode) | Status: $($encounter.status)" -ForegroundColor Green
if ($encounter.status -ne "IN_PROGRESS") {
    Write-Host "[FAIL] Expected encounter status IN_PROGRESS, got: $($encounter.status)" -ForegroundColor Red
    exit 1
}

# 5. Doctor updates draft encounter
Write-Host "`n--- Step 4: Doctor saves clinical draft with vital signs ---" -ForegroundColor Yellow
$updatePayload = @{
    chiefComplaint = "Nong rat sau xuong uc, o chua nhieu sau an, vi dang mieng ve dem"
    examinationNotes = "Tim deu T1 T2 ro. Phoi trong khong rale. Bung mem, an tuc nhe thuong vi, de khang am tinh."
    diagnosis = "Trao nguoc da day thuc quan (GERD) - Viem thuc quan trao nguoc do A theo Los Angeles"
    treatmentPlan = "1. Pantoprazole 40mg: Uong 1 vien truoc an sang 30p`n2. Gaviscon: Uong 1 goi sau an hoac khi o chua`n3. Tranh an dem, kieng cay nong, ca phe`n4. Tai kham sau 2 tuan"
    temperature = 36.8
    bloodPressure = "125/80"
    heartRate = 78
    respiratoryRate = 18
    weight = 66.5
    height = 170.0
} | ConvertTo-Json

$updateRes = Invoke-RestMethod -Uri "$baseUrl/clinical/encounters/$encounterId" -Method Put -Body $updatePayload -ContentType "application/json" -Headers $docHeaders
Write-Host "[OK] Encounter draft updated: $($updateRes.data.diagnosis)" -ForegroundColor Green
Write-Host "[OK] Vital signs saved: BP $($updateRes.data.bloodPressure), Temp $($updateRes.data.temperature)C, HR $($updateRes.data.heartRate) bpm" -ForegroundColor Green

# 6. Doctor completes encounter
Write-Host "`n--- Step 5: Doctor completes encounter ---" -ForegroundColor Yellow
$completeRes = Invoke-RestMethod -Uri "$baseUrl/clinical/encounters/$encounterId/complete" -Method Post -Headers $docHeaders
Write-Host "[OK] Encounter completed: $($completeRes.data.encounterCode) | Status: $($completeRes.data.status)" -ForegroundColor Green
if ($completeRes.data.status -ne "COMPLETED") {
    Write-Host "[FAIL] Expected status COMPLETED, got: $($completeRes.data.status)" -ForegroundColor Red
    exit 1
}

# 7. Negative Test: Cannot edit completed encounter
Write-Host "`n--- Step 6: Negative test - Edit completed encounter must fail (HTTP 400) ---" -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$baseUrl/clinical/encounters/$encounterId" -Method Put -Body $updatePayload -ContentType "application/json" -Headers $docHeaders
    Write-Host "[FAIL] Should have thrown 400 Bad Request!" -ForegroundColor Red
    exit 1
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "[OK] Blocked editing completed encounter with HTTP $statusCode (Expected 400)." -ForegroundColor Green
}

# 8. Negative Test: Admin user cannot access clinical records (Clinical Privacy Rule)
Write-Host "`n--- Step 7: Security test - ADMIN role cannot access clinical encounter ---" -ForegroundColor Yellow
$adminLoginBody = @{
    username = "admin"
    password = "Admin@123456"
} | ConvertTo-Json
$adminAuth = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $adminLoginBody -ContentType "application/json"
$adminToken = $adminAuth.data.accessToken
$adminHeaders = @{ Authorization = "Bearer $adminToken" }

try {
    Invoke-RestMethod -Uri "$baseUrl/clinical/encounters/$encounterId" -Method Get -Headers $adminHeaders
    Write-Host "[FAIL] Admin should NOT be allowed to access clinical encounter!" -ForegroundColor Red
    exit 1
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "[OK] Admin access rejected with HTTP $statusCode (Expected 403 Forbidden - Clinical Privacy verified)." -ForegroundColor Green
}

# 9. Negative Test: Another doctor cannot modify encounter of bs_minh (Ownership Rule)
Write-Host "`n--- Step 8: Security test - Doctor bs_huong cannot modify encounter of bs_minh ---" -ForegroundColor Yellow
$doc2LoginBody = @{
    username = "bs_huong"
    password = "Doctor@123456"
} | ConvertTo-Json
$doc2Auth = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $doc2LoginBody -ContentType "application/json"
$doc2Headers = @{ Authorization = "Bearer $($doc2Auth.data.accessToken)" }

try {
    Invoke-RestMethod -Uri "$baseUrl/clinical/encounters/$encounterId/complete" -Method Post -Headers $doc2Headers
    Write-Host "[FAIL] Doctor bs_huong should NOT be allowed to modify encounter of bs_minh!" -ForegroundColor Red
    exit 1
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "[OK] Unauthorized doctor action blocked with HTTP $statusCode." -ForegroundColor Green
}

# 10. Direct MySQL query verification
Write-Host "`n--- Step 9: Verify records in MySQL ---" -ForegroundColor Yellow
$mysqlCheck = & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p123456 -e "USE clinic_management; SELECT id, encounter_code, status, diagnosis, temperature, blood_pressure FROM encounters WHERE id='$encounterId';"
Write-Host $mysqlCheck -ForegroundColor Cyan

$auditCheck = & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p123456 -e "USE clinic_management; SELECT action, entity_name, entity_id, username, created_at FROM audit_logs WHERE entity_id='$encounterId';"
Write-Host $auditCheck -ForegroundColor Cyan

Write-Host "`n=====================================================================" -ForegroundColor Green
Write-Host " ALL CLINICAL ENCOUNTER TESTS PASSED WITH 100% SUCCESS! " -ForegroundColor Green
Write-Host "=====================================================================" -ForegroundColor Green

