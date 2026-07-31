/// Built-in camera service — wraps the camera plugin.
/// Provides a CameraController for the preview widget and handles
/// recording to local storage.
///
/// Note: the external UVC hat-camera path (Gen 2 rig per HARDWARE.md) is not
/// wired up yet — the previously referenced `usb_camera` package does not
/// exist on pub.dev. Built-in phone camera only for now; UVC support needs a
/// maintained plugin (e.g. uvccamera) or a native Android USB host layer.
import 'dart:async';
import 'package:camera/camera.dart';
import 'package:permission_handler/permission_handler.dart';

class CameraService {
  CameraController? _controller;
  Timer? _fpsTimer;
  int _frameCount = 0;
  int _handFrames = 0;

  bool get isInitialized => _controller?.value.isInitialized ?? false;
  double get handCoverage =>
      _frameCount > 0 ? _handFrames / _frameCount : 0.0;

  /// No external UVC camera support yet — always the built-in camera.
  bool get isUsbCamera => false;

  Future<CameraController?> initialize() async {
    await Permission.camera.request();
    await Permission.microphone.request();

    final cameras = await availableCameras();
    if (cameras.isEmpty) return null;
    _controller = CameraController(
      // Prefer front-facing on phones for hat-cam; back otherwise
      cameras.firstWhere((c) => c.lensDirection == CameraLensDirection.front,
          orElse: () => cameras.first),
      ResolutionPreset.high,
      enableAudio: true,
    );
    await _controller!.initialize();
    return _controller;
  }

  Future<String> startRecording() async {
    await _controller?.startVideoRecording();
    _fpsTimer = Timer.periodic(const Duration(seconds: 1), (_) {});
    // Actual file path is returned by stopVideoRecording (XFile); this
    // placeholder keeps the caller API stable.
    return '';
  }

  Future<void> stopRecording() async {
    _fpsTimer?.cancel();
    await _controller?.stopVideoRecording();
  }

  void recordHandFrame(bool handsDetected) {
    _frameCount++;
    if (handsDetected) _handFrames++;
  }

  void dispose() {
    _fpsTimer?.cancel();
    _controller?.dispose();
  }
}
