import 'dart:async';

import 'package:cross_file/cross_file.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../services/camera_service.dart';
import '../services/capture_keep_alive.dart';
import '../services/episode_store.dart';
import '../services/session_provider.dart';

class RecordingScreen extends ConsumerStatefulWidget {
  const RecordingScreen({super.key});

  @override
  ConsumerState<RecordingScreen> createState() => _RecordingScreenState();
}

class _RecordingScreenState extends ConsumerState<RecordingScreen>
    with WidgetsBindingObserver {
  late final CaptureCamera _camera;
  late final EpisodeWriter _episodeStore;
  late final RecordingStopper _recordingStopper;
  Timer? _timer;
  bool _initializing = true;
  bool _ending = false;
  bool _interrupted = false;
  bool _keepAliveStarted = false;
  String? _cameraError;

  static const _taskChips = [
    'wipe plate',
    'wipe counter',
    'wash dish',
    'rinse dish',
    'fold towel',
    'fold laundry',
    'sweep floor',
    'mop floor',
    'assemble item',
    'arrange decor',
    'hang item',
    'unpack box',
    'place item',
    'load rack',
    'scrub surface',
  ];

  @override
  void initState() {
    super.initState();
    _camera = ref.read(cameraServiceProvider);
    _episodeStore = ref.read(episodeStoreProvider);
    _recordingStopper = RecordingStopper(_camera);
    WidgetsBinding.instance.addObserver(this);
    unawaited(_startCapture());
  }

  Future<void> _startCapture() async {
    try {
      final ready = _camera.isInitialized || await _camera.initialize();
      if (!ready) throw StateError('No camera is available.');
      if (_camera.supportsBackgroundRecording) {
        await CaptureKeepAlive.start();
        _keepAliveStarted = true;
      }
      await _camera.startRecording();
      if (!mounted) return;
      setState(() => _initializing = false);
      _startTimer();
    } catch (_) {
      await _stopKeepAlive();
      if (!mounted) return;
      ref
          .read(sessionProvider.notifier)
          .failCapture('Camera recording could not start.');
      setState(() {
        _initializing = false;
        _cameraError = 'Camera recording could not start. Reconnect and retry.';
      });
    }
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      final session = ref.read(sessionProvider);
      if (session.isRecording) {
        ref
            .read(sessionProvider.notifier)
            .tick(session.elapsed + const Duration(seconds: 1));
      }
    });
  }

  void _setTask(String task) {
    ref.read(sessionProvider.notifier).setTask(task);
  }

  Future<XFile?> _stopCameraOnce() async {
    return _recordingStopper.stop();
  }

  Future<void> _handleInterruption() async {
    if (_camera.supportsBackgroundRecording) return;
    _timer?.cancel();
    try {
      await _stopCameraOnce();
      if (!mounted) return;
      setState(() => _interrupted = true);
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _cameraError = 'Recording was interrupted. End the shift to save it.';
      });
    }
  }

  Future<void> _endShift() async {
    if (_ending) return;
    setState(() => _ending = true);
    _timer?.cancel();

    try {
      final recorded = await _stopCameraOnce();
      await _stopKeepAlive();
      if (recorded == null) {
        throw StateError('No completed video file was returned by the camera.');
      }

      final notifier = ref.read(sessionProvider.notifier);
      notifier.stop();
      final artifact = await _episodeStore.save(
        recorded,
        ref.read(sessionProvider),
      );
      notifier.attachArtifact(
        videoPath: artifact.videoPath,
        metadataPath: artifact.metadataPath,
      );
      if (!mounted) return;
      Navigator.pushReplacementNamed(context, '/shift-end');
    } catch (_) {
      await _stopKeepAlive();
      ref
          .read(sessionProvider.notifier)
          .failCapture('The episode could not be saved.');
      if (!mounted) return;
      setState(() {
        _ending = false;
        _cameraError =
            'The episode could not be saved. The upload step is disabled.';
      });
    }
  }

  Future<void> _stopKeepAlive() async {
    if (!_keepAliveStarted) return;
    _keepAliveStarted = false;
    try {
      await CaptureKeepAlive.stop();
    } catch (_) {
      // Recording teardown must continue even if the service already stopped.
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused ||
        state == AppLifecycleState.inactive) {
      unawaited(_handleInterruption());
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(sessionProvider);
    final activeTask =
        session.taskMarkers.isNotEmpty && session.taskMarkers.last.endS == null
            ? session.taskMarkers.last.task
            : '';

    return Scaffold(
      body: Stack(
        children: [
          Positioned.fill(child: _cameraView()),
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: Container(
              color: Colors.black87,
              padding: EdgeInsets.only(
                top: MediaQuery.of(context).padding.top,
                left: 16,
                right: 16,
                bottom: 8,
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.fiber_manual_record,
                    color: _interrupted ? Colors.orange : Colors.red,
                    size: 14,
                  ),
                  const SizedBox(width: 6),
                  Text(_fmt(session.elapsed),
                      style: const TextStyle(fontSize: 18)),
                  const Spacer(),
                  Text(
                    session.handCoverage == null
                        ? 'hands not measured'
                        : '${(session.handCoverage! * 100).toStringAsFixed(0)}% hands',
                    style: const TextStyle(fontSize: 14),
                  ),
                  const SizedBox(width: 12),
                  Text('${session.taskMarkers.length} labels',
                      style: const TextStyle(fontSize: 14)),
                ],
              ),
            ),
          ),
          if (_cameraError != null || _interrupted)
            Positioned(
              top: MediaQuery.of(context).padding.top + 58,
              left: 16,
              right: 16,
              child: Material(
                color: Colors.orange.shade900,
                borderRadius: BorderRadius.circular(8),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Text(
                    _cameraError ??
                        'Recording was interrupted. End the shift to save it.',
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
            ),
          if (activeTask.isNotEmpty)
            Positioned(
              bottom: 150,
              left: 16,
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.green.withValues(alpha: 0.85),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text('task: $activeTask',
                    style: const TextStyle(fontSize: 18)),
              ),
            ),
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              color: Colors.black87,
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).padding.bottom,
                top: 8,
                left: 12,
                right: 12,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: _taskChips
                        .map(
                          (task) => ChoiceChip(
                            label: Text(task,
                                style: const TextStyle(fontSize: 12)),
                            selected: activeTask == task,
                            selectedColor: Colors.green,
                            onSelected: _initializing || _interrupted
                                ? null
                                : (_) => _setTask(task),
                            visualDensity: VisualDensity.compact,
                          ),
                        )
                        .toList(),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      const IconButton(
                        icon: Icon(Icons.delete_forever, color: Colors.grey),
                        onPressed: null,
                        tooltip: 'Delete unavailable in this prototype',
                      ),
                      const IconButton(
                        icon: Icon(Icons.pause_circle,
                            size: 48, color: Colors.grey),
                        onPressed: null,
                        tooltip: 'Pause unavailable in this prototype',
                      ),
                      IconButton(
                        icon: _ending
                            ? const SizedBox(
                                width: 36,
                                height: 36,
                                child:
                                    CircularProgressIndicator(strokeWidth: 3),
                              )
                            : const Icon(Icons.stop_circle,
                                size: 48, color: Colors.red),
                        onPressed:
                            _initializing || _cameraError != null || _ending
                                ? null
                                : _endShift,
                        tooltip: 'End shift',
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _cameraView() {
    if (!_camera.isInitialized) {
      return Center(
        child: Text(
          _initializing ? 'Starting camera...' : 'Camera unavailable',
          style: const TextStyle(color: Colors.white70),
        ),
      );
    }
    return Center(
      child: AspectRatio(
        aspectRatio: _camera.aspectRatio,
        child: _camera.buildPreview(),
      ),
    );
  }

  String _fmt(Duration duration) {
    final hours = duration.inHours.toString().padLeft(2, '0');
    final minutes = (duration.inMinutes % 60).toString().padLeft(2, '0');
    final seconds = (duration.inSeconds % 60).toString().padLeft(2, '0');
    return '$hours:$minutes:$seconds';
  }
}
