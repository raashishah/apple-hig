import SwiftUI

// flow-step:list
// flow-step:empty
// flow-step:short-create
// flow-step:long-create
// flow-step:fault
// flow-step:back

struct NotesWalk: View {
  var body: some View {
    NavigationSplitView {
      List {
        NavigationLink("Field note", destination: DetailNote())
      }
      .frame(minWidth: 280)
    } detail: {
      switch status {
      case .empty:
        Text("No items")
      case .loading:
        ProgressView()
      case .fault:
        Text("Could not load")
      case .ready:
        Button("Add") { }
      }
      Form { TextField("Title", text: .constant("")) }
        .accessibilityIdentifier("create-short")
    }
  }
}

struct DetailNote: View {
  var body: some View {
    NavigationLink("Back", destination: NotesWalk())
  }
}

struct LongCreatePage: View {
  var body: some View {
    Form { TextField("Title", text: .constant("")) }
      .accessibilityIdentifier("create-long")
  }
}
