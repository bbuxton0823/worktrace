import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';

const _unset = Object();

class TaskMarker {
  final String task;
  final double startS;
  final double? endS;
  final String source;

  const TaskMarker({
    required this.task,
    required this.startS,
    this.endS,
    this.source = 'chip_tap',
  });

  TaskMarker closeAt(double endS) => TaskMarker(
        task: task,
        startS: startS,
        endS: endS,
        source: source,
      );

  Map<String, dynamic> toJson() => {
        'task': task,
        'start': startS,
        'end': endS,
        'source': source,
      };
}

class SessionState {
  final String sessionId;
  final String workerId;
  final String jobType;
  final String? homeId;
  final bool isRecording;
  final Duration elapsed;
  final double? handCoverage;
  final List<TaskMarker> taskMarkers;
  final String? videoPath;
  final String? metadataPath;
  final String? captureError;
  final String? uploadEpisodeId;

  const SessionState({
    this.sessionId = '',
    this.workerId = '',
    this.jobType = '',
    this.homeId,
    this.isRecording = false,
    this.elapsed = Duration.zero,
    this.handCoverage,
    this.taskMarkers = const [],
    this.videoPath,
    this.metadataPath,
    this.captureError,
    this.uploadEpisodeId,
  });

  SessionState copyWith({
    String? sessionId,
    String? workerId,
    String? jobType,
    Object? homeId = _unset,
    bool? isRecording,
    Duration? elapsed,
    Object? handCoverage = _unset,
    List<TaskMarker>? taskMarkers,
    Object? videoPath = _unset,
    Object? metadataPath = _unset,
    Object? captureError = _unset,
    Object? uploadEpisodeId = _unset,
  }) =>
      SessionState(
        sessionId: sessionId ?? this.sessionId,
        workerId: workerId ?? this.workerId,
        jobType: jobType ?? this.jobType,
        homeId: identical(homeId, _unset) ? this.homeId : homeId as String?,
        isRecording: isRecording ?? this.isRecording,
        elapsed: elapsed ?? this.elapsed,
        handCoverage: identical(handCoverage, _unset)
            ? this.handCoverage
            : handCoverage as double?,
        taskMarkers: taskMarkers ?? this.taskMarkers,
        videoPath: identical(videoPath, _unset)
            ? this.videoPath
            : videoPath as String?,
        metadataPath: identical(metadataPath, _unset)
            ? this.metadataPath
            : metadataPath as String?,
        captureError: identical(captureError, _unset)
            ? this.captureError
            : captureError as String?,
        uploadEpisodeId: identical(uploadEpisodeId, _unset)
            ? this.uploadEpisodeId
            : uploadEpisodeId as String?,
      );
}

class SessionNotifier extends StateNotifier<SessionState> {
  SessionNotifier({Uuid? uuid})
      : _uuid = uuid ?? const Uuid(),
        super(const SessionState());

  final Uuid _uuid;

  SessionState get current => state;

  void start(String workerId, String jobType, {String? homeId}) {
    state = SessionState(
      sessionId: _uuid.v4(),
      workerId: workerId,
      jobType: jobType,
      homeId: homeId,
      isRecording: true,
    );
  }

  void tick(Duration elapsed) {
    state = state.copyWith(elapsed: elapsed);
  }

  void updateHandCoverage(double? coverage) {
    state = state.copyWith(handCoverage: coverage);
  }

  void setTask(String task) {
    final nowS = state.elapsed.inMilliseconds / 1000.0;
    final markers = [...state.taskMarkers];
    if (markers.isNotEmpty && markers.last.endS == null) {
      markers[markers.length - 1] = markers.last.closeAt(nowS);
    }
    markers.add(TaskMarker(task: task, startS: nowS));
    state = state.copyWith(taskMarkers: markers);
  }

  void stop() {
    final nowS = state.elapsed.inMilliseconds / 1000.0;
    final markers = [...state.taskMarkers];
    if (markers.isNotEmpty && markers.last.endS == null) {
      markers[markers.length - 1] = markers.last.closeAt(nowS);
    }
    state = state.copyWith(isRecording: false, taskMarkers: markers);
  }

  void attachArtifact(
      {required String videoPath, required String metadataPath}) {
    state = state.copyWith(
      videoPath: videoPath,
      metadataPath: metadataPath,
      captureError: null,
    );
  }

  void failCapture(String message) {
    state = state.copyWith(isRecording: false, captureError: message);
  }

  void markUploaded(String episodeId) {
    state = state.copyWith(uploadEpisodeId: episodeId);
  }
}

final sessionProvider = StateNotifierProvider<SessionNotifier, SessionState>(
  (_) => SessionNotifier(),
);
