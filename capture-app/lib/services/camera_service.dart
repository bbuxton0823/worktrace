import 'dart:async';

import 'package:camera/camera.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:permission_handler/permission_handler.dart';

abstract class CaptureCamera {
  CameraController? get controller;
  bool get isInitialized;
  bool get isUsbCamera;

  Future<bool> initialize();
  Future<void> startRecording();
  Future<XFile?> stopRecording();
  Future<void> dispose();
}

class RecordingStopper {
  RecordingStopper(this._camera);

  final CaptureCamera _camera;
  Future<XFile?>? _stopFuture;
  XFile? _stoppedFile;

  Future<XFile?> stop() async {
    if (_stoppedFile != null) return _stoppedFile;
    final pending = _stopFuture;
    if (pending != null) return pending;

    final request = _camera.stopRecording();
    _stopFuture = request;
    try {
      final file = await request;
      if (file != null) _stoppedFile = file;
      return file;
    } finally {
      if (_stoppedFile == null) _stopFuture = null;
    }
  }
}

class CameraService implements CaptureCamera {
  CameraController? _controller;

  @override
  CameraController? get controller => _controller;

  @override
  bool get isInitialized => _controller?.value.isInitialized ?? false;

  @override
  bool get isUsbCamera =>
      _controller?.description.lensDirection == CameraLensDirection.external;

  @override
  Future<bool> initialize() async {
    if (isInitialized) return true;

    final permission = await Permission.camera.request();
    if (!permission.isGranted) {
      throw CameraException(
        'CameraAccessDenied',
        'Camera permission is required to record an episode.',
      );
    }

    final cameras = await availableCameras();
    if (cameras.isEmpty) return false;

    final selected = cameras.firstWhere(
      (camera) => camera.lensDirection == CameraLensDirection.front,
      orElse: () => cameras.first,
    );
    final previous = _controller;
    _controller = null;
    await previous?.dispose();

    final nextController = CameraController(
      selected,
      ResolutionPreset.high,
      enableAudio: false,
    );
    try {
      await nextController.initialize();
      _controller = nextController;
      return true;
    } catch (_) {
      await nextController.dispose();
      rethrow;
    }
  }

  @override
  Future<void> startRecording() async {
    final active = _controller;
    if (active == null || !active.value.isInitialized) {
      throw CameraException(
        'Uninitialized CameraController',
        'The camera must be ready before recording starts.',
      );
    }
    if (!active.value.isRecordingVideo) {
      await active.startVideoRecording();
    }
  }

  @override
  Future<XFile?> stopRecording() async {
    final active = _controller;
    if (active == null ||
        !active.value.isInitialized ||
        !active.value.isRecordingVideo) {
      return null;
    }
    return active.stopVideoRecording();
  }

  @override
  Future<void> dispose() async {
    final active = _controller;
    _controller = null;
    await active?.dispose();
  }
}

final cameraServiceProvider = Provider<CaptureCamera>((ref) {
  final camera = CameraService();
  ref.onDispose(() => unawaited(camera.dispose()));
  return camera;
});
