# Android release builds

Run `npm run android:release` from `frontend-react` in PowerShell to synchronize the web app, create a signed release APK, and verify its signature.

The first run prompts for a signing-key password twice and stores the private key at `%USERPROFILE%\.android\inacaptechmarket-release.p12`, outside the repository. Later runs prompt for the same password. The password stays in memory during the build and is not written to the project.

Keep both the `.p12` file and its password backed up securely in separate locations. Do not commit or share the key. Future app updates must be signed with this same key.

The Gradle output is `android\app\build\outputs\apk\release\app-release.apk`. The release script also creates `android\app\build\outputs\apk\release\InacapTechMarket.apk` for uploading. A release APK uses a different signing key than a debug APK; uninstall the debug build from a device before installing the release build.

## Publish the download

Create a GitHub Release in `manuel158/InacapTechMarket` and attach `InacapTechMarket.apk`. The homepage links to `https://github.com/manuel158/InacapTechMarket/releases/latest/download/InacapTechMarket.apk`; this URL becomes available after the first release is published.
