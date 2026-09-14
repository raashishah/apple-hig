import PencilKit
import SwiftUI

struct ContentView: View {
  var body: some View {
    PKCanvasViewRepresentable()
  }
}

struct PKCanvasViewRepresentable: UIViewRepresentable {
  func makeUIView(context: Context) -> PKCanvasView { PKCanvasView() }
  func updateUIView(_ uiView: PKCanvasView, context: Context) {}
}
