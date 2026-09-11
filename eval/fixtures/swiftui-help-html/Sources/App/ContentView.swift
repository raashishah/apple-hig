import SwiftUI
struct ContentView: View {
  var body: some View {
    NavigationSplitView {
      List { Text("Inbox") }
    } detail: {
      Text("Select an item")
    }
  }
}
