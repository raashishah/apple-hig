// swift-tools-version: 5.9
import PackageDescription
let package = Package(name: "HigSwiftUIMac", platforms: [.macOS(.v14)], products: [], targets: [
  .executableTarget(name: "App", path: "Sources/App")
])
