// lib/models/chat_message.dart
// Auxin AI v12.0 — Flutter Chat Data Models

enum SenderType { user, milo, system }
enum RoleEnum { customer, farmer, delivery, admin, superAdmin }

extension RoleEnumExtension on RoleEnum {
  String get value {
    switch (this) {
      case RoleEnum.customer:
        return 'customer';
      case RoleEnum.farmer:
        return 'farmer';
      case RoleEnum.delivery:
        return 'delivery';
      case RoleEnum.admin:
        return 'admin';
      case RoleEnum.superAdmin:
        return 'super_admin';
    }
  }

  String get displayName {
    switch (this) {
      case RoleEnum.customer:
        return 'Customer';
      case RoleEnum.farmer:
        return 'Farmer';
      case RoleEnum.delivery:
        return 'Delivery Partner';
      case RoleEnum.admin:
        return 'Admin';
      case RoleEnum.superAdmin:
        return 'Super Admin';
    }
  }
}

class ChatMatchInfo {
  final String chunkId;
  final String category;
  final double similarity;
  final String snippet;

  ChatMatchInfo({
    required this.chunkId,
    required this.category,
    required this.similarity,
    required this.snippet,
  });

  factory ChatMatchInfo.fromJson(Map<String, dynamic> json) {
    return ChatMatchInfo(
      chunkId: json['chunk_id'] ?? '',
      category: json['category'] ?? 'general',
      similarity: (json['similarity'] ?? 0.0).toDouble(),
      snippet: json['snippet'] ?? '',
    );
  }
}

class ChatMessage {
  final String id;
  final String conversationId;
  final SenderType sender;
  final String text;
  final DateTime timestamp;
  final String? intent;
  final bool? shouldSkipRag;
  final double? latencyMs;
  final List<ChatMatchInfo> retrievedChunks;
  int? userRating; // 1 for +1, -1 for -1, null for unrated
  final bool isError;

  ChatMessage({
    required this.id,
    required this.conversationId,
    required this.sender,
    required this.text,
    required this.timestamp,
    this.intent,
    this.shouldSkipRag,
    this.latencyMs,
    this.retrievedChunks = const [],
    this.userRating,
    this.isError = false,
  });

  factory ChatMessage.fromApiResponse(Map<String, dynamic> json, String userQuery) {
    List<ChatMatchInfo> chunks = [];
    if (json['retrieved_chunks'] != null) {
      chunks = (json['retrieved_chunks'] as List)
          .map((c) => ChatMatchInfo.fromJson(c))
          .toList();
    }

    return ChatMessage(
      id: json['message_id'] ?? DateTime.now().millisecondsSinceEpoch.toString(),
      conversationId: json['conversation_id'] ?? '',
      sender: SenderType.milo,
      text: json['answer'] ?? 'No response received.',
      timestamp: DateTime.now(),
      intent: json['intent'],
      shouldSkipRag: json['should_skip_rag'],
      latencyMs: (json['latency_ms'] ?? 0.0).toDouble(),
      retrievedChunks: chunks,
    );
  }
}
