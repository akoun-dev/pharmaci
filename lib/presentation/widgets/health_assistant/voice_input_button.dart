import 'package:flutter/material.dart';

class VoiceInputButton extends StatelessWidget {
  final bool isListening;
  final VoidCallback onPressed;

  const VoiceInputButton({
    super.key,
    required this.isListening,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 48,
      height: 48,
      decoration: BoxDecoration(
        color: isListening ? Colors.red : Colors.grey[200],
        borderRadius: BorderRadius.circular(24),
      ),
      child: IconButton(
        icon: Icon(
          isListening ? Icons.mic : Icons.mic_none,
          color: isListening ? Colors.white : Colors.grey[600],
        ),
        onPressed: onPressed,
      ),
    );
  }
}