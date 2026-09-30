import SwiftUI

struct SplitPass: View {
  var body: some View {
    NavigationSplitView {
      List { }
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
      Form {
        TextField("Title", text: .constant(""))
      }
      .accessibilityIdentifier("create-short")
    }
  }
}

struct LongCreatePage: View {
  var body: some View {
    Form {
      TextField("Title", text: .constant(""))
    }
    .accessibilityIdentifier("create-long")
  }
}
