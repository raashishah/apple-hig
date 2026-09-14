import AppIntents
import SwiftUI

struct OpenInbox: AppIntent {
  static var title: LocalizedStringResource = "Open Inbox"
  func perform() async throws -> some IntentResult { .result() }
}

struct ContentView: View {
  var body: some View {
    Text("Inbox")
  }
}
