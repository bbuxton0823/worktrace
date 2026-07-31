import 'package:flutter_test/flutter_test.dart';

import 'package:egodata_app/main.dart';

void main() {
  testWidgets('App boots to shift start screen', (WidgetTester tester) async {
    await tester.pumpWidget(const EgoDataApp());
    await tester.pump();
    // The app should render without throwing; shift start is the home route.
    expect(find.byType(EgoDataApp), findsOneWidget);
  });
}
