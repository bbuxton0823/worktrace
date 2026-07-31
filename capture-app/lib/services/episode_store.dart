import 'dart:convert';
import 'dart:io';

import 'package:camera/camera.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path_provider/path_provider.dart';

import 'session_provider.dart';

class EpisodeArtifact {
  final String videoPath;
  final String metadataPath;

  const EpisodeArtifact({
    required this.videoPath,
    required this.metadataPath,
  });
}

typedef DirectoryProvider = Future<Directory> Function();

abstract class EpisodeWriter {
  Future<EpisodeArtifact> save(XFile source, SessionState session);
}

class EpisodeStore implements EpisodeWriter {
  EpisodeStore({DirectoryProvider? directoryProvider})
      : _directoryProvider =
            directoryProvider ?? getApplicationDocumentsDirectory;

  final DirectoryProvider _directoryProvider;

  @override
  Future<EpisodeArtifact> save(XFile source, SessionState session) async {
    if (session.sessionId.isEmpty) {
      throw StateError('Cannot save an episode without a session ID.');
    }

    final root = await _directoryProvider();
    final episodes = Directory('${root.path}/episodes');
    await episodes.create(recursive: true);

    final video = File('${episodes.path}/${session.sessionId}.mp4');
    await File(source.path).copy(video.path);
    final sizeBytes = await video.length();

    final metadata = File('${episodes.path}/${session.sessionId}.json');
    final body = {
      'schema_version': 1,
      'session_id': session.sessionId,
      'worker_id': session.workerId,
      'job_type': session.jobType,
      'home_id': session.homeId,
      'duration_s': session.elapsed.inMilliseconds / 1000.0,
      'hand_coverage_est': session.handCoverage,
      'task_labels':
          session.taskMarkers.map((marker) => marker.toJson()).toList(),
      'video_file': video.uri.pathSegments.last,
      'video_size_bytes': sizeBytes,
      'audio_enabled': false,
      'saved_at': DateTime.now().toUtc().toIso8601String(),
    };
    await metadata.writeAsString('${jsonEncode(body)}\n', flush: true);

    return EpisodeArtifact(
      videoPath: video.path,
      metadataPath: metadata.path,
    );
  }
}

final episodeStoreProvider = Provider<EpisodeWriter>((_) => EpisodeStore());
