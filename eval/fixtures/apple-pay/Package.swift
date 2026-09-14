// swift-tools-version: 5.9
import PackageDescription
let package = Package(name: "HigApplePayFixture", platforms: [.iOS(.v17)], products: [], targets: [
  .executableTarget(name: "App", path: "Sources/App")
])
