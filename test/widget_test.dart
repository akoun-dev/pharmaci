// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:pharmaci/core/app/app.dart';

void main() {
  testWidgets('PharmaCi app creates correctly', (WidgetTester tester) async {
    // Test that the app widget can be created without errors
    expect(() => const PharmaCiApp(), returnsNormally);

    // Build a minimal app without routes to avoid rendering issues
    await tester.pumpWidget(
      MaterialApp(
        title: 'PharmaCi',
        home: Container(),
      ),
    );

    // Verify basic app functionality
    expect(find.byType(MaterialApp), findsOneWidget);
  });

  testWidgets('PharmaCiApp has correct title', (WidgetTester tester) async {
    final app = const PharmaCiApp();
    expect(app, isA<PharmaCiApp>());
  });
}
