// lib/main.dart
// Auxin AI v12.0 — Flutter App Entrypoint

import 'package:flutter/material.dart';
import 'screens/milo_chat_screen.dart';

void main() {
  runApp(const AuxinMiloApp());
}

class AuxinMiloApp extends StatelessWidget {
  const AuxinMiloApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Auxin Milo AI',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        primarySwatch: Colors.green,
        useMaterial3: true,
      ),
      home: const MiloChatScreen(),
    );
  }
}
