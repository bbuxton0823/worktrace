import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/session_provider.dart';
import '../services/camera_service.dart';

class ShiftStartScreen extends ConsumerStatefulWidget {
  const ShiftStartScreen({super.key});

  @override
  ConsumerState<ShiftStartScreen> createState() => _ShiftStartScreenState();
}

class _ShiftStartScreenState extends ConsumerState<ShiftStartScreen> {
  final _workerCtrl = TextEditingController();
  final _homeCtrl = TextEditingController();
  String _jobType = 'kitchen_clean';
  bool _calibrating = false;
  bool _cameraReady = false;
  String _calibStatus = '';
  Timer? _cameraPoller;
  bool _refreshingCameras = false;

  static const _jobTypes = [
    'kitchen_clean',
    'bathroom_clean',
    'full_home_clean',
    'staging_assembly',
    'staging_arrange',
    'destage_pack',
    'other',
  ];

  @override
  void dispose() {
    _cameraPoller?.cancel();
    _workerCtrl.dispose();
    _homeCtrl.dispose();
    super.dispose();
  }

  Future<void> _calibrate() async {
    setState(() {
      _calibrating = true;
      _calibStatus = 'connecting to camera...';
    });
    final camera = ref.read(cameraServiceProvider);
    try {
      final ready = await camera.initialize(refresh: true);
      if (!mounted) return;
      if (!ready) {
        setState(() {
          _cameraReady = false;
          _calibStatus = 'no camera found';
          _calibrating = false;
        });
        return;
      }
      setState(() {
        _cameraReady = true;
        _calibStatus = '${camera.cameraLabel} ready ✓';
        _calibrating = false;
      });
      _startCameraPolling();
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _cameraReady = false;
        _calibStatus = 'camera unavailable, check permission and reconnect';
        _calibrating = false;
      });
    }
  }

  void _startCameraPolling() {
    _cameraPoller?.cancel();
    _cameraPoller = Timer.periodic(
      const Duration(seconds: 2),
      (_) => unawaited(_refreshCameraList()),
    );
  }

  Future<void> _refreshCameraList() async {
    if (_refreshingCameras || _calibrating) return;
    _refreshingCameras = true;
    final camera = ref.read(cameraServiceProvider);
    try {
      final changed = await camera.refreshIfCameraListChanged();
      if (!changed || !mounted) return;
      setState(() {
        _cameraReady = camera.isInitialized;
        _calibStatus = camera.isInitialized
            ? '${camera.cameraLabel} ready ✓'
            : 'camera disconnected, connect a camera and rescan';
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _cameraReady = camera.isInitialized;
        _calibStatus = 'camera change detected but preview could not start';
      });
    } finally {
      _refreshingCameras = false;
    }
  }

  void _startShift() {
    if (!_cameraReady) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Calibrate the camera before recording.')),
      );
      return;
    }
    if (_workerCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter a worker ID.')),
      );
      return;
    }
    ref.read(sessionProvider.notifier).start(
          _workerCtrl.text.trim(),
          _jobType,
          homeId: _homeCtrl.text.trim().isEmpty ? null : _homeCtrl.text.trim(),
        );
    Navigator.pushReplacementNamed(context, '/recording');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Worktrace'), centerTitle: true),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: ListView(
          children: [
            Text('New Capture Shift',
                style: Theme.of(context).textTheme.headlineMedium),
            const SizedBox(height: 24),
            TextField(
              controller: _workerCtrl,
              decoration: const InputDecoration(
                  labelText: 'Worker ID', prefixIcon: Icon(Icons.badge)),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _homeCtrl,
              decoration: const InputDecoration(
                  labelText: 'Home ID (optional)',
                  prefixIcon: Icon(Icons.home),
                  hintText: 'anonymized UUID'),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _jobType,
              decoration: const InputDecoration(
                  labelText: 'Job Type', prefixIcon: Icon(Icons.work)),
              items: _jobTypes
                  .map((j) => DropdownMenuItem(
                      value: j, child: Text(j.replaceAll('_', ' '))))
                  .toList(),
              onChanged: (v) => setState(() => _jobType = v!),
            ),
            const SizedBox(height: 24),
            OutlinedButton.icon(
              onPressed: _calibrating ? null : _calibrate,
              icon: const Icon(Icons.cameraswitch),
              label: const Text('Calibrate Camera'),
            ),
            if (_calibStatus.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(_calibStatus,
                    style: TextStyle(
                        color: _calibStatus.contains('✓')
                            ? Colors.greenAccent
                            : Colors.orangeAccent)),
              ),
            if (ref.read(cameraServiceProvider).isInitialized) ...[
              const SizedBox(height: 16),
              _cameraViewfinder(),
              const SizedBox(height: 8),
              Text(
                'Live view: ${ref.read(cameraServiceProvider).cameraLabel}',
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.white70),
              ),
            ],
            const SizedBox(height: 32),
            FilledButton.icon(
              onPressed: _cameraReady ? _startShift : null,
              icon: const Icon(Icons.fiber_manual_record, color: Colors.red),
              label: const Text('Start Recording'),
              style: FilledButton.styleFrom(
                  minimumSize: const Size.fromHeight(56)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _cameraViewfinder() {
    final camera = ref.read(cameraServiceProvider);
    if (!camera.isInitialized) {
      return const SizedBox.shrink();
    }
    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: ColoredBox(
        color: Colors.black,
        child: AspectRatio(
          aspectRatio: camera.aspectRatio,
          child: camera.buildPreview(),
        ),
      ),
    );
  }
}
