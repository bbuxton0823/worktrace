# Worktrace UVCCamera native rebuild

This spike vendors the Flutter wrapper from the official UVCCamera `0.0.13`
tag and replaces its Maven native library with an AAR rebuilt from the same
tag using Android NDK `28.2.13676358`.

Source: <https://github.com/alexey-pelykh/UVCCamera/tree/0.0.13>

- Tag commit: `d3f52416ac028a55148a8b555a8cc63053e4556b`
- Downloaded source archive SHA-256:
  `939b8aece42b7ecbec60464448ceed70bf42a4d6561ad1d0b78677ce7730d7f0`
- Rebuilt AAR SHA-256:
  `e32e6fb0cbacc87c59838c702c2cdc06760816dd5ea0bce0fc8fa0bf569d685e`

Rebuild procedure:

1. Download and extract the official `0.0.13` tag archive.
2. Apply `NDK28_16KB.patch` at the extracted repository root.
3. Point `sdk.dir` in `local.properties` at the Android SDK.
4. Run `./gradlew :lib:assembleRelease --no-daemon`.
5. Copy `lib/build/outputs/aar/lib-release.aar` to
   `capture-app/android/local-maven/org/uvccamera/lib/0.0.13-worktrace/`
   as `lib-0.0.13-worktrace.aar` and retain the adjacent POM.
6. Use NDK 28 `llvm-readelf -lW` to require `0x4000` or greater alignment for
   every ARM64 `LOAD` segment before building or installing the app.

The rebuild completed with one Java deprecation notice in `USBMonitor.java`.
The Gradle build itself completed successfully.
