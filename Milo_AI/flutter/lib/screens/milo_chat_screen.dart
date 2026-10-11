// lib/screens/milo_chat_screen.dart
// Auxin AI v12.0 — Main Milo AI Production Chat Screen UI

import 'dart:io';
import 'package:flutter/material.dart';
import '../models/chat_message.dart';
import '../services/milo_api_service.dart';
import '../services/session_manager.dart';
import '../widgets/chat_bubble.dart';
import '../widgets/typing_indicator.dart';

class MiloChatScreen extends StatefulWidget {
  const MiloChatScreen({Key? key}) : super(key: key);

  @override
  State<MiloChatScreen> createState() => _MiloChatScreenState();
}

class _MiloChatScreenState extends State<MiloChatScreen> {
  final MiloApiService _apiService = MiloApiService();
  final SessionManager _session = SessionManager();
  final TextEditingController _inputController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  bool _isLoading = false;
  bool _isOffline = false;

  @override
  void initState() {
    super.initState();
    _session.initSession(userId: 'usr-flutter-demo', role: RoleEnum.customer);
    _checkBackendHealth();
  }

  Future<void> _checkBackendHealth() async {
    final health = await _apiService.checkHealth();
    setState(() {
      _isOffline = health['status'] != 'healthy';
    });
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _sendMessage({String? queryOverride}) async {
    final query = (queryOverride ?? _inputController.text).trim();
    if (query.isEmpty || _isLoading) return;

    if (queryOverride == null) {
      _inputController.clear();
    }

    final userMsg = ChatMessage(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      conversationId: _session.currentConversationId,
      sender: SenderType.user,
      text: query,
      timestamp: DateTime.now(),
    );

    setState(() {
      _session.addMessage(userMsg);
      _isLoading = true;
    });
    _scrollToBottom();

    try {
      final res = await _apiService.sendChatMessage(
        query: query,
        conversationId: _session.currentConversationId,
        userId: _session.currentUserId,
        role: _session.currentRole,
      );

      final miloMsg = ChatMessage.fromApiResponse(res, query);

      setState(() {
        _session.addMessage(miloMsg);
        _isLoading = false;
        _isOffline = false;
      });
    } on SocketException {
      setState(() {
        _isOffline = true;
        _isLoading = false;
        _session.addMessage(ChatMessage(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          conversationId: _session.currentConversationId,
          sender: SenderType.milo,
          text: '⚠️ **Network Error**: Unable to reach Milo AI backend. Please check your internet connection and try again.',
          timestamp: DateTime.now(),
          isError: true,
        ));
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _session.addMessage(ChatMessage(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          conversationId: _session.currentConversationId,
          sender: SenderType.milo,
          text: '⚠️ **System Error**: ${e.toString()}',
          timestamp: DateTime.now(),
          isError: true,
        ));
      });
    }
    _scrollToBottom();
  }

  void _handleFeedback(ChatMessage message, int rating) async {
    setState(() {
      message.userRating = rating;
    });

    await _apiService.sendFeedback(
      conversationId: message.conversationId,
      messageId: message.id,
      rating: rating,
    );

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(rating == 1 ? 'Thank you for your positive feedback!' : 'Feedback recorded. We will improve our answers.'),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Theme(
      data: _session.isDarkMode ? ThemeData.dark() : ThemeData.light(),
      child: Scaffold(
        appBar: AppBar(
          title: Row(
            children: [
              const CircleAvatar(
                backgroundColor: Colors.green,
                radius: 16,
                child: Text('M', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ),
              const SizedBox(width: 8),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Milo AI Assistant', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  Text(
                    'Role: ${_session.currentRole.displayName}',
                    style: const TextStyle(fontSize: 11, color: Colors.greenAccent),
                  ),
                ],
              ),
            ],
          ),
          actions: [
            // Role Selector Menu
            PopupMenuButton<RoleEnum>(
              icon: const Icon(Icons.badge_outlined),
              tooltip: 'Switch Stakeholder Role',
              onSelected: (role) {
                setState(() {
                  _session.setRole(role);
                });
              },
              itemBuilder: (context) => RoleEnum.values.map((r) {
                return PopupMenuItem(
                  value: r,
                  child: Row(
                    children: [
                      Icon(r == _session.currentRole ? Icons.check_circle : Icons.circle_outlined, size: 16, color: Colors.green),
                      const SizedBox(width: 8),
                      Text(r.displayName),
                    ],
                  ),
                );
              }).toList(),
            ),
            IconButton(
              icon: Icon(_session.isDarkMode ? Icons.light_mode : Icons.dark_mode),
              tooltip: 'Toggle Theme',
              onPressed: () => setState(() => _session.toggleDarkMode()),
            ),
            PopupMenuButton<String>(
              onSelected: (val) {
                if (val == 'new') {
                  setState(() => _session.startNewConversation());
                } else if (val == 'clear') {
                  setState(() => _session.clearHistory());
                }
              },
              itemBuilder: (context) => [
                const PopupMenuItem(value: 'new', child: Text('New Conversation')),
                const PopupMenuItem(value: 'clear', child: Text('Clear Chat')),
              ],
            ),
          ],
        ),
        body: Column(
          children: [
            // Offline Status Banner
            if (_isOffline)
              Container(
                color: Colors.orange.shade800,
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 12),
                child: const Row(
                  children: [
                    Icon(Icons.wifi_off, size: 16, color: Colors.white),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Backend offline or unreachable (snjqxpelsbsvytxezwne).',
                        style: TextStyle(color: Colors.white, fontSize: 12),
                      ),
                    ),
                  ],
                ),
              ),

            // Chat Messages List
            Expanded(
              child: _session.activeMessages.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.smart_toy, size: 48, color: Colors.green.withOpacity(0.5)),
                          const SizedBox(height: 12),
                          const Text('Ask Milo anything about Auxin platform, orders, or policies.', style: TextStyle(color: Colors.grey)),
                        ],
                      ),
                    )
                  : ListView.builder(
                      controller: _scrollController,
                      padding: const EdgeInsets.only(bottom: 8),
                      itemCount: _session.activeMessages.length,
                      itemBuilder: (context, index) {
                        final msg = _session.activeMessages[index];
                        return ChatBubble(
                          message: msg,
                          onFeedback: (rating) => _handleFeedback(msg, rating),
                          onRetry: msg.isError ? () => _sendMessage(queryOverride: _session.activeMessages[index - 1].text) : null,
                        );
                      },
                    ),
            ),

            // Typing Indicator
            if (_isLoading) const TypingIndicator(),

            // Bottom Input Bar
            Container(
              padding: const EdgeInsets.all(8.0),
              decoration: BoxDecoration(
                color: Theme.of(context).cardColor,
                boxShadow: [
                  BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4, offset: const Offset(0, -2))
                ],
              ),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _inputController,
                      textInputAction: TextInputAction.send,
                      onSubmitted: (_) => _sendMessage(),
                      decoration: InputDecoration(
                        hintText: 'Ask Milo AI...',
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(24)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    icon: const Icon(Icons.send, color: Colors.green),
                    onPressed: () => _sendMessage(),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
