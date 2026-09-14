import SwiftUI

struct FoldAwareView: View {
  var body: some View {
    GeometryReader { proxy in
      let regions = proxy.reservedRegions(.all)
      Color.clear.preference(key: RegionCountKey.self, value: regions.count)
    }
  }
}

private struct RegionCountKey: PreferenceKey {
  static var defaultValue = 0
  static func reduce(value: inout Int, nextValue: () -> Int) {
    value = nextValue()
  }
}
