import 'dart:async';

import 'package:camera/camera.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:permission_handler/permission_handler.dart';

abstract class CaptureCamera {
  CameraController? get controller;
  bool get isInitialized;
  bool get isUsbCamera;
  bool get hasExternalCamera;
  String get cameraLabel;

  Future<bool> initialize({bool refresh = false});
  Future<bool> refreshIfCameraListChanged();
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
  String _cameraSignature = '';
  bool _hasExternalCamera = false;

  @override
  CameraController? get controller => _controller;

  @override
  bool get isInitialized => _controller?.value.isInitialized ?? false;

  @override
  bool get isUsbCamera =>
      _controller?.description.lensDirection == CameraLensDirection.external;

  @override
  bool get hasExternalCamera => _hasExternalCamera;

  @override
  String get cameraLabel {
    final active = _controller?.description;
    if (active == null) return 'no camera selected';
    if (active.lensDirection == CameraLensDirection.external) {
      return 'USB/external camera (${active.name})';
    }
    final side = active.lensDirection == CameraLensDirection.front
        ? 'front camera'
        : 'rear camera';
    if (_hasExternalCamera) {
      return '$side (${active.name}), external camera could not be opened';
    }
    return '$side (${active.name}), USB camera not detected by Android';
  }

  @override
  Future<bool> initialize({bool refresh = false}) async {
    if (isInitialized && !refresh) return true;

    final permission = await Permission.camera.request();
    if (!permission.isGranted) {
      throw CameraException(
        'CameraAccessDenied',
        'Camera permission is required to record an episode.',
      );
    }

    final cameras = await availableCameras();
    _cameraSignature = _signature(cameras);
    return _configure(cameras);
  }

  @override
  Future<bool> refreshIfCameraListChanged() async {
    final cameras = await availableCameras();
    final nextSignature = _signature(cameras);
    if (nextSignature == _cameraSignature) return false;
    _cameraSignature = nextSignature;
    await _configure(cameras);
    return true;
  }

  Future<bool> _configure(List<CameraDescription> cameras) async {
    _hasExternalCamera = cameras.any(
      (camera) => camera.lensDirection == CameraLensDirection.external,
    );
    final previous = _controller;
    _controller = null;
    await previous?.dispose();

    Object? lastError;
    for (final candidate in preferredCameraOrder(cameras)) {
      final nextController = CameraController(
        candidate,
        ResolutionPreset.high,
        enableAudio: false,
      );
      try {
        await nextController.initialize();
        _controller = nextController;
        return true;
      } catch (error) {
        lastError = error;
        await nextController.dispose();
      }
    }
    if (lastError != null) throw lastError;
    return false;
  }

  String _signature(List<CameraDescription> cameras) {
    final entries = cameras
        .map((camera) => '${camera.name}:${camera.lensDirection.name}')
        .toList()
      ..sort();
    return entries.join('|');
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

List<CameraDescription> preferredCameraOrder(
  List<CameraDescription> cameras,
) {
  final indexed = cameras.indexed.toList();
  int priority(CameraLensDirection direction) => switch (direction) {
        CameraLensDirection.external => 0,
        CameraLensDirection.front => 1,
        CameraLensDirection.back => 2,
      };
  indexed.sort((a, b) {
    final directionOrder =
        priority(a.$2.lensDirection).compareTo(priority(b.$2.lensDirection));
    return directionOrder != 0 ? directionOrder : a.$1.compareTo(b.$1);
  });
  return indexed.map((entry) => entry.$2).toList();
}

final cameraServiceProvider = Provider<CaptureCamera>((ref) {
  final camera = CameraService();
  ref.onDispose(() => unawaited(camera.dispose()));
  return camera;
});
