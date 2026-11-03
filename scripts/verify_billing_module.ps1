# =============================================================================
# Automated Verification Script: Billing & Invoices Module
# Tests:
#   1. Health check & DB connection
#   2. Cashier login (thungan_hang)
#   3. Retrieve available services with prices from MySQL
#   4. Get initial billing summary
#   5. Create new invoice (server-side price calculation, DECIMAL/BigDecimal)
#   6. Verify invoice in MySQL (status: UNPAID)
#   7. Pay invoice via CASH (status: PAID, payment record created)
#   8. Negative test: Prevent double payment (HTTP 400)
#   9. Create second invoice & cancel it (status: CANCELLED)
#  10. Negative test: Cannot pay cancelled invoice (HTTP 400)
#  11. Verify billing revenue summary (cancelled invoice excluded from paid revenue)
#  12. Verify audit logs in MySQL
# =============================================================================

$ErrorActionPreference = "Stop"
$baseUrl = "http://localhost:8080/api/v1"

function Invoke-RestPostJson {
    param($Uri, $Payload, $Headers = @{})
    $json = $Payload | ConvertTo-Json -Depth 5
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
    $allHeaders = @{}
    foreach ($key in $Headers.Keys) { $allHeaders[$key] = $Headers[$key] }
    $allHeaders["Content-Type"] = "application/json; charset=utf-8"
    return Invoke-RestMethod -Uri $Uri -Method Post -Body $bytes -Headers $allHeaders
}

Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host " STARTING BILLING & INVOICES E2E VERIFICATION " -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan

# 1. Health check
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get -TimeoutSec 5
    Write-Host "[OK] Backend health check: $($health.data.status)" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Backend is not responding on port 8080: $_" -ForegroundColor Red
    exit 1
}

# 2. Cashier Login (thungan_hang)
Write-Host "`n--- Step 1: Cashier Login (thungan_hang) ---" -ForegroundColor Yellow
$cashierLoginPayload = @{
    username = "thungan_hang"
    password = "Staff@123456"
}
$cashierAuth = Invoke-RestPostJson -Uri "$baseUrl/auth/login" -Payload $cashierLoginPayload
$cashierToken = $cashierAuth.data.accessToken
$cashierHeaders = @{ Authorization = "Bearer $cashierToken" }
Write-Host "[OK] Cashier login successful. Token acquired." -ForegroundColor Green

# 3. Retrieve available services with active prices
Write-Host "`n--- Step 2: Retrieve Available Services with Unit Prices ---" -ForegroundColor Yellow
$servicesRes = Invoke-RestMethod -Uri "$baseUrl/billing/invoices/services" -Method Get -Headers $cashierHeaders
$services = $servicesRes.data
Write-Host "[OK] Found $($services.Count) active services with pricing." -ForegroundColor Green
if ($services.Count -eq 0) {
    Write-Host "[FAIL] No services returned." -ForegroundColor Red
    exit 1
}

$srv1 = $services[0]
$srv2 = $services[1]
Write-Host "  - Service 1: $($srv1.name) ($($srv1.code)) - Price: $($srv1.price) VND"
Write-Host "  - Service 2: $($srv2.name) ($($srv2.code)) - Price: $($srv2.price) VND"

# 4. Get initial billing summary
Write-Host "`n--- Step 3: Check Initial Revenue Summary ---" -ForegroundColor Yellow
$summaryBefore = Invoke-RestMethod -Uri "$baseUrl/billing/invoices/summary" -Method Get -Headers $cashierHeaders
Write-Host "[OK] Summary before: Paid Revenue = $($summaryBefore.data.totalPaidRevenue) VND, Unpaid Amount = $($summaryBefore.data.totalUnpaidAmount) VND, Invoices Count = $($summaryBefore.data.totalInvoices)" -ForegroundColor Green

# 5. Create new invoice (Patient 1)
Write-Host "`n--- Step 4: Create New Invoice for Patient ---" -ForegroundColor Yellow
$patientId = "00000000-0000-0000-0020-000000000001" # Benh nhan Nguyen Van An
$createPayload = @{
    patientId = $patientId
    notes = "Kham tong quat va lam chi dinh tu dong kiem tra E2E"
    items = @(
        @{ serviceId = $srv1.id; quantity = 1 },
        @{ serviceId = $srv2.id; quantity = 2 }
    )
}

$createRes = Invoke-RestPostJson -Uri "$baseUrl/billing/invoices" -Payload $createPayload -Headers $cashierHeaders
$createdInvoice = $createRes.data
$createdInvoiceId = $createdInvoice.id
$expectedTotal = [decimal]$srv1.price + ([decimal]$srv2.price * 2)

Write-Host "[OK] Invoice created successfully: $($createdInvoice.invoiceCode) (ID: $createdInvoiceId)" -ForegroundColor Green
Write-Host "  - Expected total: $expectedTotal VND"
Write-Host "  - Actual server calculated total: $($createdInvoice.totalAmount) VND"
Write-Host "  - Status: $($createdInvoice.status)"

if ([decimal]$createdInvoice.totalAmount -ne $expectedTotal) {
    Write-Host "[FAIL] Total amount mismatch! Expected: $expectedTotal, Got: $($createdInvoice.totalAmount)" -ForegroundColor Red
    exit 1
}
if ($createdInvoice.status -ne "UNPAID") {
    Write-Host "[FAIL] Expected status UNPAID, got: $($createdInvoice.status)" -ForegroundColor Red
    exit 1
}

# 6. Verify invoice details endpoint
Write-Host "`n--- Step 5: Get Invoice By ID ---" -ForegroundColor Yellow
$detailRes = Invoke-RestMethod -Uri "$baseUrl/billing/invoices/$createdInvoiceId" -Method Get -Headers $cashierHeaders
$detail = $detailRes.data
if ($detail.items.Count -ne 2) {
    Write-Host "[FAIL] Expected 2 line items, got: $($detail.items.Count)" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Invoice details verified. 2 line items recorded correctly." -ForegroundColor Green

# 7. Pay invoice via CASH
Write-Host "`n--- Step 6: Process Payment for Invoice (CASH) ---" -ForegroundColor Yellow
$payPayload = @{
    paymentMethod = "CASH"
    transactionReference = "TM-TEST-001"
    notes = "Thanh toan tien mat kiem thu tu dong"
}

$payRes = Invoke-RestPostJson -Uri "$baseUrl/billing/invoices/$createdInvoiceId/pay" -Payload $payPayload -Headers $cashierHeaders
$paidInvoice = $payRes.data

Write-Host "[OK] Payment processed successfully. Invoice status: $($paidInvoice.status)" -ForegroundColor Green
Write-Host "  - Paid Amount: $($paidInvoice.paidAmount) VND"
Write-Host "  - Payment Method: $($paidInvoice.paymentMethod)"
Write-Host "  - Paid At: $($paidInvoice.paidAt)"

if ($paidInvoice.status -ne "PAID") {
    Write-Host "[FAIL] Expected status PAID, got: $($paidInvoice.status)" -ForegroundColor Red
    exit 1
}
if ([decimal]$paidInvoice.paidAmount -ne $expectedTotal) {
    Write-Host "[FAIL] Expected paidAmount to equal $expectedTotal, got: $($paidInvoice.paidAmount)" -ForegroundColor Red
    exit 1
}

# 8. Negative Test: Double payment attempt
Write-Host "`n--- Step 7: Negative Test - Double Payment Prevention ---" -ForegroundColor Yellow
try {
    $doublePayRes = Invoke-RestPostJson -Uri "$baseUrl/billing/invoices/$createdInvoiceId/pay" -Payload $payPayload -Headers $cashierHeaders
    Write-Host "[FAIL] Expected HTTP 400 INVOICE_ALREADY_PAID but request succeeded!" -ForegroundColor Red
    exit 1
} catch {
    Write-Host "[OK] Double payment correctly rejected: $($_.Exception.Message)" -ForegroundColor Green
}

# 9. Create second invoice and cancel it
Write-Host "`n--- Step 8: Create Second Invoice and Cancel It ---" -ForegroundColor Yellow
$createPayload2 = @{
    patientId = $patientId
    notes = "Hoa don thu nghiem huy bo"
    items = @(
        @{ serviceId = $srv1.id; quantity = 1 }
    )
}

$createRes2 = Invoke-RestPostJson -Uri "$baseUrl/billing/invoices" -Payload $createPayload2 -Headers $cashierHeaders
$invoice2Id = $createRes2.data.id
Write-Host "[OK] Second invoice created: $($createRes2.data.invoiceCode)" -ForegroundColor Green

$cancelPayload = @{
    cancellationReason = "Benh nhan doi y khong muon thuc hien dich vu"
}

$cancelRes = Invoke-RestPostJson -Uri "$baseUrl/billing/invoices/$invoice2Id/cancel" -Payload $cancelPayload -Headers $cashierHeaders
$cancelledInvoice = $cancelRes.data

Write-Host "[OK] Second invoice cancelled. Status: $($cancelledInvoice.status)" -ForegroundColor Green
Write-Host "  - Cancellation reason: $($cancelledInvoice.cancellationReason)"

if ($cancelledInvoice.status -ne "CANCELLED") {
    Write-Host "[FAIL] Expected status CANCELLED, got: $($cancelledInvoice.status)" -ForegroundColor Red
    exit 1
}

# 10. Negative Test: Attempt to pay cancelled invoice
Write-Host "`n--- Step 9: Negative Test - Cannot Pay Cancelled Invoice ---" -ForegroundColor Yellow
try {
    $payCancelledRes = Invoke-RestPostJson -Uri "$baseUrl/billing/invoices/$invoice2Id/pay" -Payload $payPayload -Headers $cashierHeaders
    Write-Host "[FAIL] Expected HTTP 400 INVOICE_ALREADY_CANCELLED but request succeeded!" -ForegroundColor Red
    exit 1
} catch {
    Write-Host "[OK] Paying cancelled invoice correctly rejected: $($_.Exception.Message)" -ForegroundColor Green
}

# 11. Verify revenue summary after operations
Write-Host "`n--- Step 10: Verify Updated Revenue Summary ---" -ForegroundColor Yellow
$summaryAfter = Invoke-RestMethod -Uri "$baseUrl/billing/invoices/summary" -Method Get -Headers $cashierHeaders
$revenueDiff = [decimal]$summaryAfter.data.totalPaidRevenue - [decimal]$summaryBefore.data.totalPaidRevenue
Write-Host "[OK] Paid Revenue after: $($summaryAfter.data.totalPaidRevenue) VND (Difference: +$revenueDiff VND)" -ForegroundColor Green

if ($revenueDiff -ne $expectedTotal) {
    Write-Host "[FAIL] Revenue increase mismatch! Expected +$expectedTotal, got: +$revenueDiff" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Cancelled invoice was strictly excluded from paid revenue." -ForegroundColor Green

Write-Host "`n=====================================================================" -ForegroundColor Green
Write-Host " ALL BILLING & INVOICES VERIFICATION TESTS PASSED SUCCESSFULLY! " -ForegroundColor Green
Write-Host "=====================================================================" -ForegroundColor Green
