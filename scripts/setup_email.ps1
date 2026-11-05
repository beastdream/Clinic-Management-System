# =====================================================================
# Cấu hình gửi email xác thực qua Gmail SMTP (lưu vào biến môi trường User)
# Cách chạy:  powershell -ExecutionPolicy Bypass -File scripts\setup_email.ps1
# Yêu cầu: Gmail đã bật xác minh 2 bước và đã tạo App Password 16 ký tự
#          (https://myaccount.google.com/apppasswords)
# =====================================================================

Write-Host ""
Write-Host "=== CẤU HÌNH GỬI EMAIL QUA GMAIL ===" -ForegroundColor Cyan
Write-Host "App Password là mã 16 ký tự tạo tại https://myaccount.google.com/apppasswords"
Write-Host "(KHÔNG phải mật khẩu đăng nhập Gmail)."
Write-Host ""

$gmail = (Read-Host "Nhập Gmail dùng để GỬI thư (VD: tenban@gmail.com)").Trim()
if ($gmail -notmatch '^[^@\s]+@[^@\s]+\.[^@\s]+$') {
    Write-Host "Email không hợp lệ. Dừng lại." -ForegroundColor Red
    exit 1
}

$secure = Read-Host "Nhập App Password 16 ký tự (ký tự sẽ được ẩn)" -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try {
    $appPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr) -replace '\s', ''
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
}

if ($appPassword.Length -ne 16) {
    Write-Host "App Password phải gồm đúng 16 ký tự (bạn nhập $($appPassword.Length) ký tự). Dừng lại." -ForegroundColor Red
    exit 1
}

# Kiểm tra đăng nhập SMTP trước khi lưu
Write-Host ""
Write-Host "Đang kiểm tra kết nối tới smtp.gmail.com:587 ..." -ForegroundColor Yellow
try {
    $client = New-Object System.Net.Mail.SmtpClient("smtp.gmail.com", 587)
    $client.EnableSsl = $true
    $client.Timeout = 15000
    $client.Credentials = New-Object System.Net.NetworkCredential($gmail, $appPassword)
    $msg = New-Object System.Net.Mail.MailMessage($gmail, $gmail)
    $msg.Subject = "MediCare Clinic - Thử cấu hình gửi email"
    $msg.Body = "Cấu hình SMTP thành công. Hệ thống đã có thể gửi email xác thực tài khoản."
    $msg.BodyEncoding = [System.Text.Encoding]::UTF8
    $msg.SubjectEncoding = [System.Text.Encoding]::UTF8
    $client.Send($msg)
    Write-Host "Gửi thử thành công! Kiểm tra hộp thư $gmail (kể cả mục Spam)." -ForegroundColor Green
} catch {
    Write-Host "Không gửi được thư thử: $($_.Exception.InnerException.Message) $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Kiểm tra lại: đúng Gmail? đúng App Password? mạng/tường lửa có chặn cổng 587?" -ForegroundColor Red
    exit 1
}

[Environment]::SetEnvironmentVariable("MAIL_HOST", "smtp.gmail.com", "User")
[Environment]::SetEnvironmentVariable("MAIL_PORT", "587", "User")
[Environment]::SetEnvironmentVariable("MAIL_USERNAME", $gmail, "User")
[Environment]::SetEnvironmentVariable("MAIL_PASSWORD", $appPassword, "User")
[Environment]::SetEnvironmentVariable("MAIL_FROM", "MediCare Clinic <$gmail>", "User")
$appPassword = $null

Write-Host ""
Write-Host "Đã lưu cấu hình email. Hãy MỞ CỬA SỔ POWERSHELL MỚI rồi chạy lại backend." -ForegroundColor Green
