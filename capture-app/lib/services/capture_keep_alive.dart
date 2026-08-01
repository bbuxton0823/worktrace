import 'package:flutter/services.dart';

class CaptureKeepAlive {
  static const _channel = MethodChannel('worktrace/capture_service');

  static Future<void> start() => _channel.invokeMethod<void>('start');

  static Future<void> stop() => _channel.invokeMethod<void>('stop');
}
