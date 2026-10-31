# Android release builds

Run `npm run android:release` from `frontend-react` in PowerShell to synchronize the web app, create a signed release APK, and verify its signature.

The first run prompts for a signing-key password twice and stores the private key at `%USERPROFILE%\.android\inacaptechmarket-release.p12`, outside the repository. Later runs prompt for the same password. The password stays in memory during the build and is not written to the project.

Keep both the `.p12` file and its password backed up securely in separate locations. Do not commit or share the key. Future app updates must be signed with this same key.

The generated APK is `android\app\build\outputs\apk\release\app-release.apk`. A release APK uses a different signing key than a debug APK; uninstall the debug build from a device before installing the release build.
