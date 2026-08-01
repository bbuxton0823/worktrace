import 'dart:async';

import 'package:camera/camera.dart' as phone;
import 'package:cross_file/cross_file.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:uvccamera/uvccamera.dart' as uvc;

abstract class CaptureCamera {
  bool get isInitialized;
  bool get isUsbCamera;
  bool get hasExternalCamera;
  bool get supportsBackgroundRecording;
  String get cameraLabel;
  double get aspectRatio;

  Widget buildPreview();
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
  static const _elpVendorId = 0x32e4;
  static const _elpProductId = 0x9230;

  phone.CameraController? _phoneController;
  uvc.UvcCameraController? _uvcController;
  String _cameraSignature = '';
  bool _hasExternalCamera = false;
  bool _uvcOpenFailed = false;

  @override
  bool get isInitialized =>
      (_uvcController?.value.isInitialized ?? false) ||
      (_phoneController?.value.isInitialized ?? false);

  @override
  bool get isUsbCamera => _uvcController?.value.isInitialized ?? false;

  @override
  bool get hasExternalCamera => _hasExternalCamera;

  @override
  bool get supportsBackgroundRecording => isUsbCamera;

  @override
  String get cameraLabel {
    final external = _uvcController;
    if (external != null && external.value.isInitialized) {
      final device = external.device;
      return 'ELP USB camera '
          '(${device.vendorId.toRadixString(16)}:'
          '${device.productId.toRadixString(16)})';
    }

    final active = _phoneController?.description;
    if (active == null) return 'no camera selected';
    final side = active.lensDirection == phone.CameraLensDirection.front
        ? 'front camera'
        : 'rear camera';
    if (_uvcOpenFailed) {
      return '$side (${active.name}), ELP detected but could not be opened';
    }
    if (_hasExternalCamera) {
      return '$side (${active.name}), external camera could not be opened';
    }
    return '$side (${active.name}), USB camera not detected by Android';
  }

  @override
  double get aspectRatio {
    final external = _uvcController;
    if (external != null && external.value.isInitialized) {
      return external.value.previewMode?.aspectRatio ?? (16 / 9);
    }
    return _phoneController?.value.aspectRatio ?? (16 / 9);
  }

  @override
  Widget buildPreview() {
    final external = _uvcController;
    if (external != null && external.value.isInitialized) {
      return uvc.UvcCameraPreview(external);
    }
    final active = _phoneController;
    if (active != null && active.value.isInitialized) {
      return phone.CameraPreview(active);
    }
    return const SizedBox.shrink();
  }

  @override
  Future<bool> initialize({bool refresh = false}) async {
    if (isInitialized && !refresh) return true;

    final permission = await Permission.camera.request();
    if (!permission.isGranted) {
      throw phone.CameraException(
        'CameraAccessDenied',
        'Camera permission is required to record an episode.',
      );
    }

    final uvcDevices = await _listUvcDevices();
    final phoneCameras = await phone.availableCameras();
    _cameraSignature = _signature(uvcDevices, phoneCameras);
    return _configure(uvcDevices, phoneCameras);
  }

  @override
  Future<bool> refreshIfCameraListChanged() async {
    final uvcDevices = await _listUvcDevices();
    final phoneCameras = await phone.availableCameras();
    final nextSignature = _signature(uvcDevices, phoneCameras);
    if (nextSignature == _cameraSignature) return false;
    _cameraSignature = nextSignature;
    await _configure(uvcDevices, phoneCameras);
    return true;
  }

  Future<Map<String, uvc.UvcCameraDevice>> _listUvcDevices() async {
    try {
      if (!await uvc.UvcCamera.isSupported()) return const {};
      return await uvc.UvcCamera.getDevices();
    } catch (_) {
      return const {};
    }
  }

  Future<bool> _configure(
    Map<String, uvc.UvcCameraDevice> uvcDevices,
    List<phone.CameraDescription> phoneCameras,
  ) async {
    _hasExternalCamera = uvcDevices.isNotEmpty ||
        phoneCameras.any(
          (camera) =>
              camera.lensDirection == phone.CameraLensDirection.external,
        );
    _uvcOpenFailed = false;
    await _disposeControllers();

    final external = _preferredUvcDevice(uvcDevices.values);
    if (external != null) {
      final next = uvc.UvcCameraController(
        device: external,
        resolutionPreset: uvc.UvcCameraResolutionPreset.high,
      );
      try {
        final granted = await uvc.UvcCamera.requestDevicePermission(external);
        if (!granted) throw StateError('USB camera permission was denied.');
        await next.initialize();
        _uvcController = next;
        return true;
      } catch (_) {
        _uvcOpenFailed = true;
        await _safeDisposeUvc(next);
      }
    }

    Object? lastError;
    for (final candidate in preferredCameraOrder(phoneCameras)) {
      final next = phone.CameraController(
        candidate,
        phone.ResolutionPreset.high,
        enableAudio: false,
      );
      try {
        await next.initialize();
        _phoneController = next;
        return true;
      } catch (error) {
        lastError = error;
        await next.dispose();
      }
    }
    if (lastError != null) throw lastError;
    return false;
  }

  uvc.UvcCameraDevice? _preferredUvcDevice(
    Iterable<uvc.UvcCameraDevice> devices,
  ) {
    uvc.UvcCameraDevice? first;
    for (final device in devices) {
      first ??= device;
      if (device.vendorId == _elpVendorId &&
          device.productId == _elpProductId) {
        return device;
      }
    }
    return first;
  }

  String _signature(
    Map<String, uvc.UvcCameraDevice> uvcDevices,
    List<phone.CameraDescription> phoneCameras,
  ) {
    final entries = <String>[
      ...uvcDevices.values.map(
        (device) => 'uvc:${device.name}:${device.vendorId}:${device.productId}',
      ),
      ...phoneCameras.map(
        (camera) => 'phone:${camera.name}:${camera.lensDirection.name}',
      ),
    ]..sort();
    return entries.join('|');
  }

  @override
  Future<void> startRecording() async {
    final external = _uvcController;
    if (external != null && external.value.isInitialized) {
      final mode = external.value.previewMode;
      if (mode == null) throw StateError('ELP preview mode is unavailable.');
      if (!external.value.isRecordingVideo) {
        await external.startVideoRecording(mode);
      }
      return;
    }

    final active = _phoneController;
    if (active == null || !active.value.isInitialized) {
      throw phone.CameraException(
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
    final external = _uvcController;
    if (external != null &&
        external.value.isInitialized &&
        external.value.isRecordingVideo) {
      return external.stopVideoRecording();
    }

    final active = _phoneController;
    if (active == null ||
        !active.value.isInitialized ||
        !active.value.isRecordingVideo) {
      return null;
    }
    return active.stopVideoRecording();
  }

  Future<void> _disposeControllers() async {
    final phoneController = _phoneController;
    final uvcController = _uvcController;
    _phoneController = null;
    _uvcController = null;
    await phoneController?.dispose();
    if (uvcController != null) await _safeDisposeUvc(uvcController);
  }

  Future<void> _safeDisposeUvc(uvc.UvcCameraController controller) async {
    try {
      await controller.dispose();
    } catch (_) {
      // A failed USB open may leave an initialization future with an error.
    }
  }

  @override
  Future<void> dispose() => _disposeControllers();
}

List<phone.CameraDescription> preferredCameraOrder(
  List<phone.CameraDescription> cameras,
) {
  final indexed = cameras.indexed.toList();
  int priority(phone.CameraLensDirection direction) => switch (direction) {
        phone.CameraLensDirection.external => 0,
        phone.CameraLensDirection.front => 1,
        phone.CameraLensDirection.back => 2,
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
