import SwiftUI

struct SplitEmptySelect: View {
  var body: some View {
    NavigationSplitView {
      List { }
    } detail: {
      Text("No vendors yet")
    }
    .listStatus(.empty)
  }
}

struct SplitListWidth: View {
  var body: some View {
    NavigationSplitView {
      List { }
        .frame(minWidth: 220, idealWidth: 320)
    } detail: {
      EmptyView()
    }
  }
}

struct LongCreatePage: View {
  var body: some View {
    Form {
      TextField("Name", text: .constant(""))
    }
    .createKind(.long)
  }
}

struct ShortCreateInDetail: View {
  var body: some View {
    NavigationSplitView {
      List { Text("Vendor") }
    } detail: {
      Form {
        TextField("Name", text: .constant(""))
      }
      .createKind(.short)
    }
  }
}

struct ListStatusLifecycle: View {
  var body: some View {
    VStack {
      ListStatus.loading
      Text("Loading vendors")
      ListStatus.fault
      Text("Could not load vendors")
      ListStatus.ready
      Button("Add") { }
      Text("Select a vendor")
    }
  }
}
