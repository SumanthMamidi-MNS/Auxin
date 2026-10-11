// lib/services/milo_api_service.dart
// Auxin AI v12.0 — Production HTTP Client Service for FastAPI

import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../models/chat_message.dart';

class MiloApiService {
  final String baseUrl;

  MiloApiService({
    this.baseUrl = 'http://10.0.2.2:8000/api/chat', // Default for Android Emulator / localhost
  });

  /// Sends user query to `POST /api/chat`
  Future<Map<String, dynamic>> sendChatMessage({
    required String query,
    required String conversationId,
    required String userId,
    required RoleEnum role,
    String? categoryFilter,
  }) async {
    final url = Uri.parse(baseUrl);
    final payload = {
      'query': query,
      'conversation_id': conversationId,
      'user_id': userId,
      'role': role.value,
      'category_filter': categoryFilter,
    };

    try {
      final response = await http
          .post(
            url,
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode(payload),
          )
          .timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw HttpException('Backend returned HTTP ${response.statusCode}: ${response.body}');
      }
    } on SocketException {
      throw const SocketException('No internet connection or backend API is unreachable.');
    } catch (e) {
      rethrow;
    }
  }

  /// Submits rating feedback to `POST /api/chat/feedback`
  Future<bool> sendFeedback({
    required String conversationId,
    required String messageId,
    required int rating,
    String? comment,
  }) async {
    final url = Uri.parse('$baseUrl/feedback');
    final payload = {
      'conversation_id': conversationId,
      'message_id': messageId,
      'rating': rating,
      'comment': comment,
    };

    try {
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(payload),
      );
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  /// Verifies backend health via `GET /api/chat/health`
  Future<Map<String, dynamic>> checkHealth() async {
    final url = Uri.parse('$baseUrl/health');
    try {
      final response = await http.get(url).timeout(const Duration(seconds: 5));
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      // Offline fallback status
    }
    return {'status': 'offline', 'service': 'Milo AI Backend (Unreachable)'};
  }
}
