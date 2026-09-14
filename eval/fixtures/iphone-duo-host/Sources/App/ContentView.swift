import SwiftUI

struct ContentView: View {
  var body: some View {
    ArrangementView {
      Text("Primary")
    } secondary: {
      Text("Secondary")
    }
    .arrangementViewStyle(.split)
  }
}
