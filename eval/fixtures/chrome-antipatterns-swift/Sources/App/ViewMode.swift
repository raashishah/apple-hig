import SwiftUI

struct ViewModePicker: View {
  @State private var mode = 0

  var body: some View {
    Picker("View", selection: $mode) {
      Text("List").tag(0)
      Text("Grid").tag(1)
    }
  }
}
