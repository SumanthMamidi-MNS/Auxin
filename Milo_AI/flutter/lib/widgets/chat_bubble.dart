// lib/widgets/chat_bubble.dart
// Auxin AI v12.0 — Markdown-Rendered Chat Bubble Widget with Copy & Feedback

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import '../models/chat_message.dart';

class ChatBubble extends StatelessWidget {
  final ChatMessage message;
  final Function(int rating)? onFeedback;
  final VoidCallback? onRetry;

  const ChatBubble({
    Key? key,
    required this.message,
    this.onFeedback,
    this.onRetry,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final isUser = message.sender == SenderType.user;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 6, horizontal: 12),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.82),
        decoration: BoxDecoration(
          color: isUser
              ? Colors.green.shade700
              : (isDark ? Colors.grey.shade900 : Colors.grey.shade100),
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(isUser ? 16 : 4),
            bottomRight: Radius.circular(isUser ? 4 : 16),
          ),
          border: Border.all(
            color: isUser ? Colors.transparent : (isDark ? Colors.grey.shade800 : Colors.grey.shade300),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 4,
              offset: const Offset(0, 2),
            )
          ],
        ),
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Sender Avatar & Timestamp Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Icon(
                      isUser ? Icons.person : Icons.smart_toy,
                      size: 14,
                      color: isUser ? Colors.white70 : Colors.green,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      isUser ? 'You' : 'Milo AI',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: isUser ? Colors.white : Colors.green.shade400,
                      ),
                    ),
                  ],
                ),
                Text(
                  '${message.timestamp.hour.toString().padLeft(2, '0')}:${message.timestamp.minute.toString().padLeft(2, '0')}',
                  style: TextStyle(fontSize: 10, color: isUser ? Colors.white54 : Colors.grey),
                ),
              ],
            ),
            const SizedBox(height: 8),

            // Message Body (Markdown for Milo, Plain Text for User)
            if (isUser)
              Text(
                message.text,
                style: const TextStyle(color: Colors.white, fontSize: 14, height: 1.4),
              )
            else
              MarkdownBody(
                data: message.text,
                selectable: true,
                styleSheet: MarkdownStyleSheet(
                  p: TextStyle(fontSize: 14, height: 1.4, color: isDark ? Colors.white70 : Colors.black87),
                  code: TextStyle(
                    backgroundColor: isDark ? Colors.black45 : Colors.grey.shade200,
                    fontFamily: 'monospace',
                    fontSize: 12,
                  ),
                ),
              ),

            // Retrieved Chunks Metadata Badge (if available)
            if (!isUser && message.retrievedChunks.isNotEmpty) ...[
              const SizedBox(height: 8),
              Wrap(
                spacing: 4,
                children: message.retrievedChunks.map((chunk) {
                  return Chip(
                    labelPadding: const EdgeInsets.symmetric(horizontal: 4, vertical: -4),
                    avatar: const Icon(Icons.source, size: 10, color: Colors.green),
                    label: Text(
                      '${chunk.category} (${(chunk.similarity * 100).toStringAsFixed(0)}%)',
                      style: const TextStyle(fontSize: 9),
                    ),
                    backgroundColor: isDark ? Colors.grey.shade800 : Colors.grey.shade200,
                  );
                }).toList(),
              ),
            ],

            // Action Toolbar (Copy, Feedback +1 / -1, Retry)
            if (!isUser) ...[
              const SizedBox(height: 6),
              const Divider(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  IconButton(
                    icon: const Icon(Icons.copy, size: 14),
                    tooltip: 'Copy Response',
                    onPressed: () {
                      Clipboard.setData(ClipboardData(text: message.text));
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Copied to clipboard!'), duration: Duration(seconds: 1)),
                      );
                    },
                  ),
                  Row(
                    children: [
                      IconButton(
                        icon: Icon(
                          Icons.thumb_up_alt_outlined,
                          size: 14,
                          color: message.userRating == 1 ? Colors.green : Colors.grey,
                        ),
                        tooltip: 'Helpful',
                        onPressed: () => onFeedback?.call(1),
                      ),
                      IconButton(
                        icon: Icon(
                          Icons.thumb_down_alt_outlined,
                          size: 14,
                          color: message.userRating == -1 ? Colors.red : Colors.grey,
                        ),
                        tooltip: 'Not Helpful',
                        onPressed: () => onFeedback?.call(-1),
                      ),
                      if (onRetry != null)
                        IconButton(
                          icon: const Icon(Icons.refresh, size: 14, color: Colors.blue),
                          tooltip: 'Retry',
                          onPressed: onRetry,
                        ),
                    ],
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}
