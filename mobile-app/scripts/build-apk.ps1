param()
Set-Location -Path (Split-Path -Parent $MyInvocation.MyCommand.Path) | Out-Null
Set-Location .. | Out-Null
npm install
npx expo prebuild
if (!(Test-Path -Path "android")) { throw "Android folder not found" }
Set-Location android
./gradlew assembleRelease
Set-Location ..
New-Item -ItemType Directory -Force -Path "releases" | Out-Null
Copy-Item "android/app/build/outputs/apk/release/app-release.apk" "releases/ar-nav-vi-preview.apk" -Force
