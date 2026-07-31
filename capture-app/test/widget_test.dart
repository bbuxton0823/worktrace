import 'dart:convert';
import 'dart:io';

import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:egodata_app/screens/recording_screen.dart';
import 'package:egodata_app/screens/shift_end_screen.dart';
import 'package:egodata_app/services/camera_service.dart';
import 'package:egodata_app/services/episode_store.dart';
import 'package:egodata_app/services/session_provider.dart';
import 'package:egodata_app/services/upload_service.dart';

class FakeCamera implements CaptureCamera {
  FakeCamera(this.file);

  final XFile file;
  int startCalls = 0;
  int stopCalls = 0;

  @override
  CameraController? get controller => null;

  @override
  bool get isInitialized => true;

  @override
  bool get isUsbCamera => false;

  @override
  Future<bool> initialize() async => true;

  @override
  Future<void> startRecording() async {
    startCalls++;
  }

  @override
  Future<XFile?> stopRecording() async {
    stopCalls++;
    return file;
  }

  @override
  Future<void> dispose() async {}
}

class NullThenFileCamera extends FakeCamera {
  NullThenFileCamera(super.file);

  @override
  Future<XFile?> stopRecording() async {
    stopCalls++;
    return stopCalls == 1 ? null : file;
  }
}

class FakeUploader implements EpisodeUploader {
  FakeUploader({this.failUpload = false});

  final bool failUpload;
  final List<String> calls = [];

  @override
  Future<Map<String, dynamic>> directUpload(
    File file,
    String workerId,
    String jobType,
  ) async {
    calls.add('upload');
    if (failUpload) throw const HttpException('offline');
    return {
      'key': 'uploads/$workerId/episode.mp4',
      'size': file.lengthSync(),
    };
  }

  @override
  Future<Map<String, dynamic>> confirm(
    String key,
    String workerId,
    double durationS, {
    double? handCoverage,
    int taskLabelCount = 0,
  }) async {
    calls.add('confirm');
    return {'episode_id': 'ep-bench-001', 'status': 'queued'};
  }
}

class FakeEpisodeWriter implements EpisodeWriter {
  int saveCalls = 0;

  @override
  Future<EpisodeArtifact> save(XFile source, SessionState session) async {
    saveCalls++;
    return const EpisodeArtifact(
      videoPath: '/saved/episode.mp4',
      metadataPath: '/saved/episode.json',
    );
  }
}

void main() {
  testWidgets(
    'End Shift saves the recorded file and metadata',
    (tester) async {
      tester.view.physicalSize = const Size(1080, 2520);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      final temp = Directory.systemTemp.createTempSync('worktrace-test-');
      addTearDown(() => temp.deleteSync(recursive: true));
      final source = File('${temp.path}/camera-output.mp4');
      source.writeAsBytesSync([0, 1, 2, 3, 4]);
      final camera = FakeCamera(XFile(source.path));
      final episodeWriter = FakeEpisodeWriter();
      final session = SessionNotifier()..start('bench-worker', 'kitchen_clean');
      session.setTask('wipe plate');

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            cameraServiceProvider.overrideWithValue(camera),
            episodeStoreProvider.overrideWithValue(episodeWriter),
            sessionProvider.overrideWith((_) => session),
          ],
          child: MaterialApp(
            home: const RecordingScreen(),
            routes: {
              '/shift-end': (_) => const ShiftEndScreen(),
            },
          ),
        ),
      );
      await tester.pump();

      await tester.tap(find.byTooltip('End shift'));
      await tester.pump();
      await tester.pump();

      expect(find.text('Shift Complete'), findsOneWidget);
      expect(camera.startCalls, 1);
      expect(camera.stopCalls, 1);
      expect(episodeWriter.saveCalls, 1);
      expect(session.current.videoPath, '/saved/episode.mp4');
    },
  );

  test('Recording stop is idempotent after a lifecycle interruption', () async {
    final temp = await Directory.systemTemp.createTemp('worktrace-stop-');
    addTearDown(() => temp.delete(recursive: true));
    final source = File('${temp.path}/camera-output.mp4');
    await source.writeAsBytes([0, 1]);
    final camera = FakeCamera(XFile(source.path));
    final stopper = RecordingStopper(camera);

    final interruptedFile = await stopper.stop();
    final endShiftFile = await stopper.stop();

    expect(interruptedFile?.path, source.path);
    expect(endShiftFile?.path, source.path);
    expect(camera.stopCalls, 1);
  });

  test('A pre-recording lifecycle stop does not consume the final stop',
      () async {
    final temp = await Directory.systemTemp.createTemp('worktrace-race-');
    addTearDown(() => temp.delete(recursive: true));
    final source = File('${temp.path}/camera-output.mp4');
    await source.writeAsBytes([0, 1]);
    final camera = NullThenFileCamera(XFile(source.path));
    final stopper = RecordingStopper(camera);

    expect(await stopper.stop(), isNull);
    expect((await stopper.stop())?.path, source.path);
    expect(camera.stopCalls, 2);
  });

  test('Episode store preserves the video and writes its metadata sidecar',
      () async {
    final temp = await Directory.systemTemp.createTemp('worktrace-store-');
    addTearDown(() => temp.delete(recursive: true));
    final source = File('${temp.path}/camera-output.mp4');
    await source.writeAsBytes([0, 1, 2, 3, 4]);
    final session = SessionNotifier()
      ..start('bench-worker', 'kitchen_clean')
      ..setTask('wipe plate')
      ..stop();
    final store = EpisodeStore(directoryProvider: () async => temp);

    final artifact = await store.save(XFile(source.path), session.current);

    expect(await File(artifact.videoPath).readAsBytes(), [0, 1, 2, 3, 4]);
    final metadata =
        jsonDecode(await File(artifact.metadataPath).readAsString())
            as Map<String, dynamic>;
    expect(metadata['worker_id'], 'bench-worker');
    expect(metadata['audio_enabled'], isFalse);
    expect((metadata['task_labels'] as List).length, 1);
  });

  testWidgets('Upload transfers the saved file before confirming the episode',
      (tester) async {
    final temp = Directory.systemTemp.createTempSync('worktrace-upload-');
    addTearDown(() => temp.deleteSync(recursive: true));
    final video = File('${temp.path}/episode.mp4');
    video.writeAsBytesSync([1, 2, 3]);
    final session = SessionNotifier()
      ..start('bench-worker', 'kitchen_clean')
      ..setTask('wipe plate')
      ..stop()
      ..attachArtifact(
        videoPath: video.path,
        metadataPath: '${temp.path}/episode.json',
      );
    final uploader = FakeUploader();

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          sessionProvider.overrideWith((_) => session),
          uploadServiceProvider.overrideWithValue(uploader),
        ],
        child: const MaterialApp(home: ShiftEndScreen()),
      ),
    );

    await tester.tap(find.text('Upload to Worktrace'));
    await tester.pump();
    await tester.pump();

    expect(uploader.calls, ['upload', 'confirm']);
    expect(find.textContaining('ep-bench-001'), findsOneWidget);
    expect(session.current.uploadEpisodeId, 'ep-bench-001');
  });

  testWidgets('Upload failure retains the video and never confirms',
      (tester) async {
    final temp = Directory.systemTemp.createTempSync('worktrace-failure-');
    addTearDown(() => temp.deleteSync(recursive: true));
    final video = File('${temp.path}/episode.mp4');
    video.writeAsBytesSync([1, 2, 3]);
    final session = SessionNotifier()
      ..start('bench-worker', 'kitchen_clean')
      ..stop()
      ..attachArtifact(
        videoPath: video.path,
        metadataPath: '${temp.path}/episode.json',
      );
    final uploader = FakeUploader(failUpload: true);

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          sessionProvider.overrideWith((_) => session),
          uploadServiceProvider.overrideWithValue(uploader),
        ],
        child: const MaterialApp(home: ShiftEndScreen()),
      ),
    );

    await tester.tap(find.text('Upload to Worktrace'));
    await tester.pump();
    await tester.pump();

    expect(uploader.calls, ['upload']);
    expect(video.existsSync(), isTrue);
    expect(find.textContaining('remains saved'), findsOneWidget);
  });

  test('Starting a new session clears nullable and artifact state', () {
    final session = SessionNotifier();
    session.start('worker-one', 'kitchen_clean', homeId: 'home-one');
    session.updateHandCoverage(0.9);
    session.stop();
    session.attachArtifact(videoPath: '/old.mp4', metadataPath: '/old.json');

    session.start('worker-two', 'bathroom_clean');

    expect(session.current.workerId, 'worker-two');
    expect(session.current.homeId, isNull);
    expect(session.current.handCoverage, isNull);
    expect(session.current.videoPath, isNull);
    expect(session.current.taskMarkers, isEmpty);
  });
}
