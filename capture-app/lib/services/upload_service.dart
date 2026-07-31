import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;

abstract class EpisodeUploader {
  Future<Map<String, dynamic>> directUpload(
    File file,
    String workerId,
    String jobType,
  );

  Future<Map<String, dynamic>> confirm(
    String key,
    String workerId,
    double durationS, {
    double? handCoverage,
    int taskLabelCount,
  });
}

class UploadService implements EpisodeUploader {
  UploadService({
    required this.baseUrl,
    this.apiKey,
    http.Client? client,
    this.timeout = const Duration(minutes: 10),
  })  : _client = client ?? http.Client(),
        _ownsClient = client == null;

  final String baseUrl;
  final String? apiKey;
  final Duration timeout;
  final http.Client _client;
  final bool _ownsClient;

  Map<String, String> get _authHeaders =>
      apiKey == null ? {} : {'Authorization': 'Bearer $apiKey'};

  Map<String, String> get _jsonHeaders => {
        ..._authHeaders,
        'Content-Type': 'application/json',
      };

  Future<Map<String, dynamic>> requestUploadUrl(
    String workerId,
    String jobType, {
    String? homeId,
  }) async {
    final response = await _client
        .post(
          Uri.parse('$baseUrl/ingest/upload-url'),
          headers: _jsonHeaders,
          body: jsonEncode({
            'worker_id': workerId,
            'job_type': jobType,
            'home_id': homeId,
          }),
        )
        .timeout(timeout);
    _requireSuccess(response, 'upload-url');
    return _decodeObject(response.body, 'upload-url');
  }

  Future<void> uploadToPresigned(String url, File file) async {
    final request = http.StreamedRequest('PUT', Uri.parse(url));
    request.headers['Content-Type'] = 'video/mp4';
    request.contentLength = await file.length();
    await request.sink.addStream(file.openRead());
    await request.sink.close();
    final response = await _client.send(request).timeout(timeout);
    if (!_isSuccess(response.statusCode)) {
      throw HttpException('upload failed with ${response.statusCode}');
    }
  }

  @override
  Future<Map<String, dynamic>> directUpload(
    File file,
    String workerId,
    String jobType,
  ) async {
    if (!await file.exists()) {
      throw FileSystemException('Recorded video does not exist.', file.path);
    }
    final request =
        http.MultipartRequest('POST', Uri.parse('$baseUrl/ingest/direct'));
    request.headers.addAll(_authHeaders);
    request.fields['worker_id'] = workerId;
    request.fields['job_type'] = jobType;
    request.files.add(await http.MultipartFile.fromPath('file', file.path));
    final streamed = await _client.send(request).timeout(timeout);
    final response = await http.Response.fromStream(streamed);
    _requireSuccess(response, 'direct-upload');
    final result = _decodeObject(response.body, 'direct-upload');
    final localSize = await file.length();
    if (result['status'] != 'stored' ||
        result['key'] is! String ||
        result['size'] != localSize) {
      throw const FormatException(
        'Upload response did not verify the stored file.',
      );
    }
    return result;
  }

  @override
  Future<Map<String, dynamic>> confirm(
    String key,
    String workerId,
    double durationS, {
    double? handCoverage,
    int taskLabelCount = 0,
  }) async {
    final response = await _client
        .post(
          Uri.parse('$baseUrl/ingest/confirm'),
          headers: _jsonHeaders,
          body: jsonEncode({
            'key': key,
            'worker_id': workerId,
            'duration_s': durationS,
            'hand_coverage_est': handCoverage,
            'task_label_count': taskLabelCount,
          }),
        )
        .timeout(timeout);
    _requireSuccess(response, 'confirm');
    return _decodeObject(response.body, 'confirm');
  }

  void close() {
    if (_ownsClient) _client.close();
  }

  bool _isSuccess(int statusCode) => statusCode >= 200 && statusCode < 300;

  void _requireSuccess(http.Response response, String operation) {
    if (!_isSuccess(response.statusCode)) {
      throw HttpException('$operation failed with ${response.statusCode}');
    }
  }

  Map<String, dynamic> _decodeObject(String body, String operation) {
    final decoded = jsonDecode(body);
    if (decoded is! Map<String, dynamic>) {
      throw const FormatException('Expected a JSON object response.');
    }
    return decoded;
  }
}

const worktraceApiBaseUrl = String.fromEnvironment(
  'WORKTRACE_API_BASE_URL',
  defaultValue: '',
);

final uploadServiceProvider = Provider<EpisodeUploader?>((ref) {
  if (worktraceApiBaseUrl.isEmpty) return null;
  final upload = UploadService(baseUrl: worktraceApiBaseUrl);
  ref.onDispose(upload.close);
  return upload;
});
