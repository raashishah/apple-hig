import HealthKit
import SwiftUI

final class HealthStore {
  let store = HKHealthStore()
}

struct ContentView: View {
  var body: some View {
    Text("Health")
  }
}
