import SwiftUI
import WidgetKit

struct ToggleTorch: ControlWidget {
  var body: some ControlWidgetConfiguration {
    StaticControlConfiguration(kind: "torch") {
      ControlWidgetButton(action: OpenApp()) {
        Label("Torch", systemImage: "flashlight.on.fill")
      }
    }
  }
}

struct ContentView: View {
  var body: some View {
    Button("In-app") {}
  }
}
