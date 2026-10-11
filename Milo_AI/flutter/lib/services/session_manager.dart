// lib/services/session_manager.dart
// Auxin AI v12.0 — Flutter Session & Role State Manager

import 'package:uuid/uuid.dart';
import '../models/chat_message.dart';

class SessionManager {
  static final SessionManager _instance = SessionManager._internal();
  factory SessionManager() => _instance;
  SessionManager._internal();

  final Uuid _uuid = const Uuid();

  late String currentConversationId;
  late String currentUserId;
  RoleEnum currentRole = RoleEnum.customer;
  bool isDarkMode = true;
  List<ChatMessage> activeMessages = [];

  void initSession({String? userId, RoleEnum? role}) {
    currentConversationId = _uuid.v4();
    currentUserId = userId ?? 'usr-${_uuid.v4().substring(0, 8)}';
    currentRole = role ?? RoleEnum.customer;
    activeMessages.clear();
  }

  void startNewConversation() {
    currentConversationId = _uuid.v4();
    activeMessages.clear();
  }

  void setRole(RoleEnum newRole) {
    currentRole = newRole;
  }

  void toggleDarkMode() {
    isDarkMode = !isDarkMode;
  }

  void addMessage(ChatMessage message) {
    activeMessages.add(message);
  }

  void clearHistory() {
    activeMessages.clear();
  }
}
