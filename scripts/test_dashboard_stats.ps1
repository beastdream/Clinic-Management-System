$loginBody = @{
    username = "admin"
    password = "Admin@123456"
} | ConvertTo-Json

$auth = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $auth.data.accessToken

$stats = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/dashboard/stats" -Headers @{ Authorization = "Bearer $token" }
Write-Host "Total Patients:" $stats.data.totalPatients
Write-Host "Total Doctors:" $stats.data.totalDoctors
Write-Host "Today Appointments:" $stats.data.todayAppointments
Write-Host "Waiting Appointments:" $stats.data.waitingAppointments
Write-Host "Completed Encounters:" $stats.data.completedEncounters
Write-Host "Paid Revenue:" $stats.data.paidRevenue
Write-Host "`nStatus Breakdown:"
$stats.data.statusBreakdown | ForEach-Object { Write-Host " - $($_.label) ($($_.status)): $($_.count) (Color: $($_.color))" }
Write-Host "`nDaily Appointments:"
$stats.data.dailyAppointments | ForEach-Object { Write-Host " - Date: $($_.date): $($_.count)" }
Write-Host "`nRecent Appointments (Count: $($stats.data.recentAppointments.Count))"
$stats.data.recentAppointments | ForEach-Object { Write-Host " - $($_.appointmentCode): $($_.patientName) -> $($_.doctorName) ($($_.status))" }

