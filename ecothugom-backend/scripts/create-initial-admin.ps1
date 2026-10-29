param([switch]$UsePackagedJar)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

# Keep credentials in this process only; never pass the password as a command-line argument.
$variableNames = @('BOOTSTRAP_ADMIN_ENABLED','BOOTSTRAP_ADMIN_NAME','BOOTSTRAP_ADMIN_PHONE','BOOTSTRAP_ADMIN_EMAIL','BOOTSTRAP_ADMIN_PASSWORD')
$previousValues = @{}
foreach ($variableName in $variableNames) {
    $previousValues[$variableName] = [Environment]::GetEnvironmentVariable($variableName, 'Process')
}
$passwordPointer = [IntPtr]::Zero
$confirmationPointer = [IntPtr]::Zero
$securePassword = $null
$secureConfirmation = $null
try {
    $env:BOOTSTRAP_ADMIN_NAME = ([string](Read-Host 'Ho ten quan tri vien')).Trim()
    if ([string]::IsNullOrWhiteSpace($env:BOOTSTRAP_ADMIN_NAME) -or $env:BOOTSTRAP_ADMIN_NAME.Length -gt 100) {
        throw 'Ho ten khong duoc de trong va phai toi da 100 ky tu. Hay chay lai script.'
    }
    $env:BOOTSTRAP_ADMIN_PHONE = ([string](Read-Host 'So dien thoai moi (10 chu so, bat dau 03/05/07/08/09)')).Trim()
    if ($env:BOOTSTRAP_ADMIN_PHONE -notmatch '^0[35789][0-9]{8}$') {
        throw 'So dien thoai phai du 10 chu so, bat dau bang 03, 05, 07, 08 hoac 09; khong dung dau 01. Hay chay lai script.'
    }
    $env:BOOTSTRAP_ADMIN_EMAIL = ([string](Read-Host 'Email (co the de trong)')).Trim()
    $securePassword = Read-Host 'Mat khau (12-64 ky tu, toi da 72 byte UTF-8)' -AsSecureString
    if ($securePassword.Length -lt 12 -or $securePassword.Length -gt 64) {
        throw 'Mat khau phai tu 12 den 64 ky tu. Hay chay lai script va nhap mat khau dai hon neu chua du 12 ky tu.'
    }
    $secureConfirmation = Read-Host 'Nhap lai mat khau' -AsSecureString
    $passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    $confirmationPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureConfirmation)
    $bootstrapSecret = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
    $confirmationSecret = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($confirmationPointer)
    if ([Text.Encoding]::UTF8.GetByteCount($bootstrapSecret) -gt 72) {
        throw 'Mat khau phai toi da 72 byte UTF-8. Hay chay lai script va dung mat khau ngan hon.'
    }
    if ($bootstrapSecret -cne $confirmationSecret) { throw 'Mat khau nhap lai khong khop.' }
    $env:BOOTSTRAP_ADMIN_PASSWORD = $bootstrapSecret
    $env:BOOTSTRAP_ADMIN_ENABLED = 'true'
    Write-Host 'Khoi dong backend va tao admin neu so dien thoai nay chua ton tai. Ctrl+C de dung.'
    & (Join-Path $PSScriptRoot 'start-local.ps1') -UsePackagedJar:$UsePackagedJar
}
finally {
    if ($passwordPointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer) }
    if ($confirmationPointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($confirmationPointer) }
    if ($null -ne $securePassword) { $securePassword.Dispose() }
    if ($null -ne $secureConfirmation) { $secureConfirmation.Dispose() }
    $bootstrapSecret = $null
    $confirmationSecret = $null
    foreach ($variableName in $variableNames) {
        [Environment]::SetEnvironmentVariable($variableName, $previousValues[$variableName], 'Process')
    }
}
