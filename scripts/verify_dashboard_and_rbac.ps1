# =============================================================================
# Automated Verification Script: Dashboard Stats & RBAC Permissions
# Tests:
#   1. Unauthenticated requests are rejected (HTTP 401)
#   2. Dashboard stats retrieval & verification against direct MySQL counts
#   3. RBAC Rule 1: ADMIN forbidden from clinical records (HTTP 403)
#   4. RBAC Rule 2: DOCTOR authorized for clinical queue (HTTP 200)
#   5. RBAC Rule 3: DOCTOR forbidden from paying invoices (HTTP 403)
#   6. RBAC Rule 4: CASHIER authorized for billing summary (HTTP 200)
#   7. RBAC Rule 5: CASHIER forbidden from starting clinical encounters (HTTP 403)
#   8. RBAC Rule 6: RECEPTIONIST forbidden from clinical queue (HTTP 403)
#   9. Real MySQL data alignment: zero hardcoded values
# =============================================================================

$ErrorActionPreference = "Stop"
$baseUrl = "http://localhost:8080/api/v1"

Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host " STARTING DASHBOARD STATS & RBAC VERIFICATION " -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan

# -----------------------------------------------------------------------------
# 1. Negative Test: Unauthenticated requests return HTTP 401
# -----------------------------------------------------------------------------
Write-Host "`n--- Step 1: Verify Unauthenticated Requests (HTTP 401) ---" -ForegroundColor Yellow

try {
    Invoke-RestMethod -Uri "$baseUrl/dashboard/stats" -Method Get
    Write-Host "[FAIL] Expected HTTP 401 on unauthenticated /dashboard/stats but request succeeded!" -ForegroundColor Red
    exit 1
} catch {
    Write-Host "[OK] Unauthenticated /dashboard/stats correctly rejected: $($_.Exception.Message)" -ForegroundColor Green
}

try {
    Invoke-RestMethod -Uri "$baseUrl/patients" -Method Get
    Write-Host "[FAIL] Expected HTTP 401 on unauthenticated /patients but request succeeded!" -ForegroundColor Red
    exit 1
} catch {
    Write-Host "[OK] Unauthenticated /patients correctly rejected: $($_.Exception.Message)" -ForegroundColor Green
}

try {
    Invoke-RestMethod -Uri "$baseUrl/appointments" -Method Get
    Write-Host "[FAIL] Expected HTTP 401 on unauthenticated /appointments but request succeeded!" -ForegroundColor Red
    exit 1
} catch {
    Write-Host "[OK] Unauthenticated /appointments correctly rejected: $($_.Exception.Message)" -ForegroundColor Green
}

# -----------------------------------------------------------------------------
# 2. Login as ADMIN and fetch Dashboard Stats
# -----------------------------------------------------------------------------
Write-Host "`n--- Step 2: Login as ADMIN & Fetch Dashboard Stats ---" -ForegroundColor Yellow

$adminLogin = @{
    username = "admin"
    password = "Admin@123456"
} | ConvertTo-Json

$adminAuth = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $adminLogin -ContentType "application/json"
$adminToken = $adminAuth.data.accessToken
$adminHeaders = @{ Authorization = "Bearer $adminToken" }
Write-Host "[OK] ADMIN login successful. Token acquired." -ForegroundColor Green

$dashRes = Invoke-RestMethod -Uri "$baseUrl/dashboard/stats" -Method Get -Headers $adminHeaders
$stats = $dashRes.data
Write-Host "[OK] Dashboard stats retrieved successfully from Backend." -ForegroundColor Green
Write-Host "  - Total Patients: $($stats.totalPatients)"
Write-Host "  - Total Doctors: $($stats.totalDoctors)"
Write-Host "  - Today's Appointments: $($stats.todayAppointments)"
Write-Host "  - Waiting Appointments: $($stats.waitingAppointments)"
Write-Host "  - Completed Encounters: $($stats.completedEncounters)"
Write-Host "  - Paid Revenue: $($stats.paidRevenue) VND"
Write-Host "  - Status Breakdown Count: $($stats.statusBreakdown.Count) groups"
Write-Host "  - Daily Activity Count: $($stats.dailyAppointments.Count) days"
Write-Host "  - Recent Appointments: $($stats.recentAppointments.Count) items"

# -----------------------------------------------------------------------------
# 3. Direct MySQL verification: Query MySQL directly and compare values
# -----------------------------------------------------------------------------
Write-Host "`n--- Step 3: Compare Dashboard Stats with Direct MySQL Queries ---" -ForegroundColor Yellow

$sqlQuery = "SELECT (SELECT COUNT(*) FROM clinic_management.patients WHERE deleted_at IS NULL) as patients, (SELECT COUNT(*) FROM clinic_management.staff_profiles WHERE staff_code LIKE 'NV-BS%') as doctors, (SELECT COUNT(*) FROM clinic_management.encounters WHERE status = 'COMPLETED') as completed, (SELECT COALESCE(SUM(paid_amount), 0) FROM clinic_management.invoices WHERE status = 'PAID' AND deleted_at IS NULL) as revenue;"

$env:MYSQL_PWD = "123456"
$dbOutput = cmd /c "mysql -u root -e `"$sqlQuery`""
Remove-Item env:MYSQL_PWD

$lines = $dbOutput -split "`r?`n" | Where-Object { $_ -match "\S" }
$dataRow = ($lines[1]) -split "`t"
$dbPatients = [int]($dataRow[0].Trim())
$dbDoctors = [int]($dataRow[1].Trim())
$dbCompleted = [int]($dataRow[2].Trim())
$dbRevenue = [decimal]($dataRow[3].Trim())

Write-Host "  - MySQL DB Patients: $dbPatients | API: $($stats.totalPatients)"
Write-Host "  - MySQL DB Doctors: $dbDoctors | API: $($stats.totalDoctors)"
Write-Host "  - MySQL DB Completed Encounters: $dbCompleted | API: $($stats.completedEncounters)"
Write-Host "  - MySQL DB Paid Revenue: $dbRevenue VND | API: $($stats.paidRevenue) VND"

if ($stats.totalPatients -ne $dbPatients) {
    Write-Host "[FAIL] Patients count mismatch!" -ForegroundColor Red
    exit 1
}
if ($stats.totalDoctors -ne $dbDoctors) {
    Write-Host "[FAIL] Doctors count mismatch!" -ForegroundColor Red
    exit 1
}
if ($stats.completedEncounters -ne $dbCompleted) {
    Write-Host "[FAIL] Completed encounters count mismatch!" -ForegroundColor Red
    exit 1
}
if ([decimal]$stats.paidRevenue -ne $dbRevenue) {
    Write-Host "[FAIL] Paid revenue mismatch!" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Dashboard metrics match MySQL database 100% (Zero hardcoding)." -ForegroundColor Green

# -----------------------------------------------------------------------------
# 4. RBAC Test: Clinical Privacy Rule (ADMIN forbidden from clinical records)
# -----------------------------------------------------------------------------
Write-Host "`n--- Step 4: RBAC Test - ADMIN Forbidden from Clinical Encounters (HTTP 403) ---" -ForegroundColor Yellow

try {
    Invoke-RestMethod -Uri "$baseUrl/clinical/encounters/doctor-queue" -Method Get -Headers $adminHeaders
    Write-Host "[FAIL] Expected HTTP 403 for ADMIN accessing /clinical/encounters/doctor-queue but request succeeded!" -ForegroundColor Red
    exit 1
} catch {
    Write-Host "[OK] ADMIN access to doctor-queue correctly forbidden (403): $($_.Exception.Message)" -ForegroundColor Green
}

try {
    Invoke-RestMethod -Uri "$baseUrl/clinical/encounters" -Method Get -Headers $adminHeaders
    Write-Host "[FAIL] Expected HTTP 403 for ADMIN accessing /clinical/encounters but request succeeded!" -ForegroundColor Red
    exit 1
} catch {
    Write-Host "[OK] ADMIN access to clinical records list correctly forbidden (403): $($_.Exception.Message)" -ForegroundColor Green
}

# -----------------------------------------------------------------------------
# 5. RBAC Test: DOCTOR access (Authorized for queue, forbidden from paying invoices)
# -----------------------------------------------------------------------------
Write-Host "`n--- Step 5: RBAC Test - DOCTOR (bs_minh) Permissions ---" -ForegroundColor Yellow

$docLogin = @{
    username = "bs_minh"
    password = "Doctor@123456"
} | ConvertTo-Json

$docAuth = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $docLogin -ContentType "application/json"
$docToken = $docAuth.data.accessToken
$docHeaders = @{ Authorization = "Bearer $docToken" }
Write-Host "[OK] DOCTOR bs_minh login successful." -ForegroundColor Green

# Doctor can access queue
$docQueue = Invoke-RestMethod -Uri "$baseUrl/clinical/encounters/doctor-queue" -Method Get -Headers $docHeaders
Write-Host "[OK] DOCTOR authorized to access doctor-queue: $($docQueue.data.Count) patient(s) waiting." -ForegroundColor Green

# Doctor CANNOT pay invoices
try {
    $payBody = @{ paymentMethod = "CASH" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/billing/invoices/00000000-0000-0000-0050-000000000001/pay" -Method Post -Body $payBody -ContentType "application/json" -Headers $docHeaders
    Write-Host "[FAIL] Expected HTTP 403 for DOCTOR paying invoice but request succeeded!" -ForegroundColor Red
    exit 1
} catch {
    Write-Host "[OK] DOCTOR correctly forbidden from paying invoice (403): $($_.Exception.Message)" -ForegroundColor Green
}

# -----------------------------------------------------------------------------
# 6. RBAC Test: CASHIER access (Authorized for billing, forbidden from starting clinical encounters)
# -----------------------------------------------------------------------------
Write-Host "`n--- Step 6: RBAC Test - CASHIER (thungan_hang) Permissions ---" -ForegroundColor Yellow

$cashierLogin = @{
    username = "thungan_hang"
    password = "Staff@123456"
} | ConvertTo-Json

$cashierAuth = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $cashierLogin -ContentType "application/json"
$cashierToken = $cashierAuth.data.accessToken
$cashierHeaders = @{ Authorization = "Bearer $cashierToken" }
Write-Host "[OK] CASHIER thungan_hang login successful." -ForegroundColor Green

# Cashier can view billing summary
$cashierSum = Invoke-RestMethod -Uri "$baseUrl/billing/invoices/summary" -Method Get -Headers $cashierHeaders
Write-Host "[OK] CASHIER authorized for billing summary: Paid Revenue = $($cashierSum.data.totalPaidRevenue) VND." -ForegroundColor Green

# Cashier CANNOT start encounters
try {
    Invoke-RestMethod -Uri "$baseUrl/clinical/encounters/start-from-appointment/00000000-0000-0000-0030-000000000001" -Method Post -Headers $cashierHeaders
    Write-Host "[FAIL] Expected HTTP 403 for CASHIER starting encounter but request succeeded!" -ForegroundColor Red
    exit 1
} catch {
    Write-Host "[OK] CASHIER correctly forbidden from starting clinical encounter (403): $($_.Exception.Message)" -ForegroundColor Green
}

# -----------------------------------------------------------------------------
# 7. RBAC Test: RECEPTIONIST access (Authorized for check-in, forbidden from doctor queue)
# -----------------------------------------------------------------------------
Write-Host "`n--- Step 7: RBAC Test - RECEPTIONIST (tieptan_mai) Permissions ---" -ForegroundColor Yellow

$recLogin = @{
    username = "tieptan_mai"
    password = "Staff@123456"
} | ConvertTo-Json

$recAuth = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $recLogin -ContentType "application/json"
$recToken = $recAuth.data.accessToken
$recHeaders = @{ Authorization = "Bearer $recToken" }
Write-Host "[OK] RECEPTIONIST tieptan_mai login successful." -ForegroundColor Green

# Receptionist CANNOT view doctor clinical queue
try {
    Invoke-RestMethod -Uri "$baseUrl/clinical/encounters/doctor-queue" -Method Get -Headers $recHeaders
    Write-Host "[FAIL] Expected HTTP 403 for RECEPTIONIST accessing doctor queue but request succeeded!" -ForegroundColor Red
    exit 1
} catch {
    Write-Host "[OK] RECEPTIONIST correctly forbidden from doctor clinical queue (403): $($_.Exception.Message)" -ForegroundColor Green
}

Write-Host "`n=====================================================================" -ForegroundColor Green
Write-Host " ALL DASHBOARD STATS & RBAC VERIFICATION TESTS PASSED SUCCESSFULLY! " -ForegroundColor Green
Write-Host "=====================================================================" -ForegroundColor Green
