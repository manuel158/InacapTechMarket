$ErrorActionPreference = 'Stop'

$frontendRoot = Split-Path -Parent $PSScriptRoot
$keystorePath = Join-Path $HOME '.android\inacaptechmarket-release.p12'
$keyAlias = 'inacaptechmarket'
$sdkRoot = if ($env:ANDROID_SDK_ROOT) {
    $env:ANDROID_SDK_ROOT
} elseif ($env:ANDROID_HOME) {
    $env:ANDROID_HOME
} else {
    Join-Path $env:LOCALAPPDATA 'Android\Sdk'
}

if (-not $env:JAVA_HOME -or -not (Test-Path (Join-Path $env:JAVA_HOME 'bin\keytool.exe'))) {
    $adoptiumRoot = Join-Path $env:ProgramFiles 'Eclipse Adoptium'
    $installedJdks = if (Test-Path $adoptiumRoot) {
        Get-ChildItem $adoptiumRoot -Directory | Sort-Object Name -Descending
    } else {
        @()
    }
    $jdk = $installedJdks |
        Where-Object { Test-Path (Join-Path $_.FullName 'bin\keytool.exe') } |
        Select-Object -First 1

    if ($jdk) {
        $env:JAVA_HOME = $jdk.FullName
        $env:PATH = (Join-Path $jdk.FullName 'bin') + ';' + $env:PATH
    }
}

$keytool = Join-Path $env:JAVA_HOME 'bin\keytool.exe'
if (-not (Test-Path $keytool)) {
    throw 'JDK 21 was not found. Install it or set JAVA_HOME before building the Android release.'
}
if (-not (Test-Path (Join-Path $sdkRoot 'platforms\android-36\android.jar'))) {
    throw "Android SDK Platform 36 was not found in '$sdkRoot'. Set ANDROID_SDK_ROOT to the SDK location."
}

function ConvertTo-PlainText([Security.SecureString]$Value) {
    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Value)
    try {
        [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
    } finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
    }
}

function Invoke-CheckedCommand(
    [string]$Executable,
    [string[]]$Arguments,
    [string]$FailureMessage
) {
    $previousErrorActionPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'Continue'
        & $Executable @Arguments
        $exitCode = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }

    if ($exitCode -ne 0) {
        throw "$FailureMessage (exit code $exitCode)."
    }
}

$password = $null
$previousStorePassword = $env:ANDROID_RELEASE_STORE_PASSWORD
$previousKeyPassword = $env:ANDROID_RELEASE_KEY_PASSWORD
$env:ANDROID_RELEASE_STORE_FILE = $keystorePath
$env:ANDROID_RELEASE_KEY_ALIAS = $keyAlias
$env:ANDROID_SDK_ROOT = $sdkRoot
$env:ANDROID_HOME = $sdkRoot
$env:PATH = (Join-Path $sdkRoot 'platform-tools') + ';' + $env:PATH

try {
    $securePassword = Read-Host 'Ingresa una contraseña segura para la clave de firma (mínimo 6 caracteres)' -AsSecureString
    if ($securePassword.Length -lt 6) {
        throw 'La contraseña debe tener al menos 6 caracteres.'
    }
    $password = ConvertTo-PlainText $securePassword

    if (-not (Test-Path $keystorePath)) {
        $confirmation = Read-Host 'Confirma la contraseña de la clave de firma' -AsSecureString
        $confirmationText = ConvertTo-PlainText $confirmation
        if ($password -cne $confirmationText) {
            throw 'Las contraseñas no coinciden. No se creó la clave de firma.'
        }
        $confirmationText = $null

        $keystoreDirectory = Split-Path -Parent $keystorePath
        New-Item -ItemType Directory -Force -Path $keystoreDirectory | Out-Null
        $env:ANDROID_RELEASE_STORE_PASSWORD = $password
        $env:ANDROID_RELEASE_KEY_PASSWORD = $password

        Write-Host "Creando la clave de firma fuera del repositorio: $keystorePath"
        try {
            Invoke-CheckedCommand -Executable $keytool -Arguments @(
                '-genkeypair', '-v',
                '-keystore', $keystorePath,
                '-storetype', 'PKCS12',
                '-alias', $keyAlias,
                '-keyalg', 'RSA',
                '-keysize', '2048',
                '-validity', '10000',
                '-dname', 'CN=InacapTechMarket',
                '-storepass:env', 'ANDROID_RELEASE_STORE_PASSWORD',
                '-keypass:env', 'ANDROID_RELEASE_KEY_PASSWORD'
            ) -FailureMessage 'No se pudo crear la clave de firma'
        } catch {
            if (Test-Path $keystorePath) {
                Remove-Item -LiteralPath $keystorePath -Force
            }
            throw
        }
    } else {
        $env:ANDROID_RELEASE_STORE_PASSWORD = $password
        $env:ANDROID_RELEASE_KEY_PASSWORD = $password
    }

    Invoke-CheckedCommand -Executable $keytool -Arguments @(
        '-list',
        '-keystore', $keystorePath,
        '-storetype', 'PKCS12',
        '-alias', $keyAlias,
        '-storepass:env', 'ANDROID_RELEASE_STORE_PASSWORD'
    ) -FailureMessage 'No se pudo abrir la clave de firma con esa contraseña o el alias no existe' |
        Out-Null

    Push-Location $frontendRoot
    try {
        Invoke-CheckedCommand -Executable 'npm.cmd' -Arguments @('run', 'cap:sync') `
            -FailureMessage 'Capacitor sync failed'

        Push-Location (Join-Path $frontendRoot 'android')
        try {
            Invoke-CheckedCommand -Executable '.\gradlew.bat' -Arguments @('assembleRelease') `
                -FailureMessage 'Gradle release build failed'
        } finally {
            Pop-Location
        }
    } finally {
        Pop-Location
    }

    $apkPath = Join-Path $frontendRoot 'android\app\build\outputs\apk\release\app-release.apk'
    if (-not (Test-Path $apkPath)) {
        throw "The release build completed but the APK was not found: $apkPath"
    }

    $apksigner = Join-Path $sdkRoot 'build-tools\36.0.0\apksigner.bat'
    if (-not (Test-Path $apksigner)) {
        throw "Android APK signer was not found: $apksigner"
    }
    Invoke-CheckedCommand -Executable $apksigner -Arguments @('verify', '--verbose', $apkPath) `
        -FailureMessage 'The generated APK did not pass signature verification'

    Get-Item $apkPath | Select-Object FullName, Length, LastWriteTime
} finally {
    $env:ANDROID_RELEASE_STORE_PASSWORD = $previousStorePassword
    $env:ANDROID_RELEASE_KEY_PASSWORD = $previousKeyPassword
    $password = $null
}
