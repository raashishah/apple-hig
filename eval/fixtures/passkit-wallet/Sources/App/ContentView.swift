import PassKit
import SwiftUI

final class PassStore {
  let library = PKPassLibrary()
}

struct ContentView: View {
  var body: some View {
    Text("Wallet")
  }
}
