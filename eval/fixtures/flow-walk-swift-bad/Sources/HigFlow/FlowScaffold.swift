import SwiftUI

// hig-flow-scaffold
// flow-step:list
// flow-step:empty

struct NotesWalk: View {
  var body: some View {
    NavigationSplitView {
      List { }
        .frame(width: 48)
    } detail: {
      switch status {
      case .empty:
        Text("Select an item")
      case .loading:
        Button("Add") { }
        Text("Select an item")
      case .fault:
        Button("Add") { }
      default:
        EmptyView()
      }
      Form { TextField("Title", text: .constant("")) }
        .accessibilityIdentifier("create-long")
    }
  }
}
