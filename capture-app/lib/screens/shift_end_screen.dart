import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../services/session_provider.dart';
import '../services/upload_service.dart';

class ShiftEndScreen extends ConsumerStatefulWidget {
  const ShiftEndScreen({super.key});

  @override
  ConsumerState<ShiftEndScreen> createState() => _ShiftEndScreenState();
}

class _ShiftEndScreenState extends ConsumerState<ShiftEndScreen> {
  bool _uploading = false;
  String _uploadStatus = '';
  bool _uploadSucceeded = false;
  int _rating = 0;

  Future<void> _upload() async {
    final session = ref.read(sessionProvider);
    final uploader = ref.read(uploadServiceProvider);
    final videoPath = session.videoPath;
    if (uploader == null) {
      setState(() {
        _uploadStatus = 'Upload endpoint is not configured for this build.';
      });
      return;
    }
    if (videoPath == null) {
      setState(() => _uploadStatus = 'No saved video is available to upload.');
      return;
    }

    setState(() {
      _uploading = true;
      _uploadStatus = 'Uploading saved video...';
      _uploadSucceeded = false;
    });

    try {
      final stored = await uploader.directUpload(
        File(videoPath),
        session.workerId,
        session.jobType,
      );
      final key = stored['key'];
      if (key is! String || key.isEmpty) {
        throw const FormatException('Upload response did not include a key.');
      }
      final receipt = await uploader.confirm(
        key,
        session.workerId,
        session.elapsed.inMilliseconds / 1000.0,
        handCoverage: session.handCoverage,
        taskLabelCount: session.taskMarkers.length,
      );
      final episodeId = receipt['episode_id'];
      if (episodeId is! String || episodeId.isEmpty) {
        throw const FormatException(
            'Confirmation did not include an episode ID.');
      }
      ref.read(sessionProvider.notifier).markUploaded(episodeId);
      if (!mounted) return;
      setState(() {
        _uploadSucceeded = true;
        _uploadStatus = 'Uploaded and confirmed: $episodeId';
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _uploadSucceeded = false;
        _uploadStatus = 'Upload failed. The video remains saved on this phone.';
      });
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(sessionProvider);
    final coverage = session.handCoverage;
    final videoName = session.videoPath == null
        ? 'not saved'
        : File(session.videoPath!).uri.pathSegments.last;

    return Scaffold(
      appBar: AppBar(title: const Text('Shift Complete'), centerTitle: true),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: ListView(
          children: [
            const Icon(Icons.check_circle, color: Colors.green, size: 80),
            const SizedBox(height: 16),
            Text(
              'Shift finished',
              style: Theme.of(context).textTheme.headlineMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            _statRow('Worker', session.workerId),
            _statRow('Job type', session.jobType),
            _statRow(
              'Duration',
              '${session.elapsed.inMinutes}m ${session.elapsed.inSeconds % 60}s',
            ),
            _statRow(
              'Hand coverage',
              coverage == null
                  ? 'not measured'
                  : '${(coverage * 100).toStringAsFixed(1)}%',
            ),
            _statRow('Task labels', '${session.taskMarkers.length}'),
            _statRow('Saved video', videoName),
            const SizedBox(height: 32),
            FilledButton.icon(
              onPressed:
                  _uploading || session.videoPath == null ? null : _upload,
              icon: _uploading
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.cloud_upload),
              label: Text(_uploading ? 'Uploading...' : 'Upload to Worktrace'),
              style: FilledButton.styleFrom(
                  minimumSize: const Size.fromHeight(56)),
            ),
            if (_uploadStatus.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  _uploadStatus,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: _uploadSucceeded
                        ? Colors.greenAccent
                        : Colors.orangeAccent,
                  ),
                ),
              ),
            const SizedBox(height: 24),
            const Text('How was this shift?', textAlign: TextAlign.center),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                5,
                (index) => IconButton(
                  icon: Icon(
                    index < _rating ? Icons.star : Icons.star_border,
                    color: Colors.amber,
                    size: 36,
                  ),
                  onPressed: () => setState(() => _rating = index + 1),
                ),
              ),
            ),
            const SizedBox(height: 32),
            OutlinedButton(
              onPressed: () => Navigator.pushReplacementNamed(context, '/'),
              child: const Text('Start New Shift'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _statRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.white54)),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.end,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
          ),
        ],
      ),
    );
  }
}
