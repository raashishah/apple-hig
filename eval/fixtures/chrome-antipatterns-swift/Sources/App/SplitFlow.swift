import SwiftUI

struct SplitEmptySelect: View {
  var body: some View {
    NavigationSplitView {
      List { }
    } detail: {
      Text("Select a vendor")
    }
    .listStatus(.empty)
  }
}

struct SplitListWidth: View {
  var body: some View {
    NavigationSplitView {
      List { }
        .frame(width: 48)
    } detail: {
      EmptyView()
    }
  }
}

struct LongCreateInSplit: View {
  var body: some View {
    NavigationSplitView {
      List { Text("Vendor") }
    } detail: {
      Form {
        TextField("Name", text: .constant(""))
      }
      .createKind(.long)
    }
  }
}

struct ShortCreateOutsideDetail: View {
  var body: some View {
    NavigationSplitView {
      List { Text("Vendor") }
    } detail: {
      EmptyView()
    }
    Form {
      TextField("Name", text: .constant(""))
    }
    .createKind(.short)
  }
}

struct ListStatusLifecycle: View {
  var body: some View {
    VStack {
      ListStatus.loading
      Button("Add") { }
      Text("Select a vendor")
      ListStatus.fault
      Button("Add") { }
      Text("Select a vendor")
      ListStatus.empty
      Button("Add") { }
    }
  }
}
