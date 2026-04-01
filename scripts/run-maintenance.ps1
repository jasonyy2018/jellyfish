$adminToken = $env:JELLYFISH_ADMIN_TOKEN
if (-not $adminToken) {
  Write-Error "JELLYFISH_ADMIN_TOKEN is required"
  exit 1
}

$apiUrl = if ($env:JELLYFISH_API_URL) { $env:JELLYFISH_API_URL } else { "http://localhost:3002" }

Invoke-RestMethod `
  -Method Post `
  -Uri "$apiUrl/api/system/maintenance" `
  -Headers @{ "x-admin-token" = $adminToken } | ConvertTo-Json -Depth 5
