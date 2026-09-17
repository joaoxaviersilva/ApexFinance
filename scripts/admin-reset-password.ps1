$ErrorActionPreference = "Stop"

[Console]::InputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

function ConvertFrom-SecureStringToPlainText {
    param (
        [Parameter(Mandatory = $true)]
        [Security.SecureString] $SecureString
    )

    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR(
        $SecureString
    )

    try {
        return [Runtime.InteropServices.Marshal]::PtrToStringBSTR(
            $pointer
        )
    }
    finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR(
            $pointer
        )
    }
}

$email = Read-Host "E-mail do usuário"

if ([string]::IsNullOrWhiteSpace($email)) {
    Write-Error "O e-mail é obrigatório."
    exit 1
}

$securePassword = Read-Host `
    "Nova senha" `
    -AsSecureString

$password = ConvertFrom-SecureStringToPlainText `
    -SecureString $securePassword

if ([string]::IsNullOrWhiteSpace($password)) {
    Write-Error "A nova senha é obrigatória."
    exit 1
}

$env:APEX_RESET_EMAIL = $email.Trim()
$env:APEX_RESET_PASSWORD = $password

try {
    npx tsx ./scripts/admin-reset-password.ts

    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}
finally {
    Remove-Item Env:APEX_RESET_EMAIL `
        -ErrorAction SilentlyContinue

    Remove-Item Env:APEX_RESET_PASSWORD `
        -ErrorAction SilentlyContinue

    $password = $null
    $securePassword = $null
}