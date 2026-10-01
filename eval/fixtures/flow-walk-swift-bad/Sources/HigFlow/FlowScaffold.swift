import SwiftUI

// hig-flow-scaffold
// flow-step:list
// flow-step:empty

struct NotesWalk: View {
  var body: some View {
    NavigationSplitView {
      List { }
        .frame(width: 48)
        .listStatus(.empty)
    } detail: {
      Text("Select a note")
      switch status {
      case .empty:
        Text("Select a note")
      case .loading:
        Button("Add") { }
        Text("Select a note")
      case .fault:
        // ListStatus.fault
        Button("Add") { }
        Text("Select a note")
      default:
        EmptyView()
      }
      Form { TextField("Title", text: .constant("")) }
        .accessibilityIdentifier("create-long")
        .createKind(.long)
    }
  }
}
