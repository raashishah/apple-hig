import PassKit
import SwiftUI

final class PaySession: NSObject, PKPaymentAuthorizationControllerDelegate {
  func pay() {
    let request = PKPaymentRequest()
    let controller = PKPaymentAuthorizationController(paymentRequest: request)
    controller.delegate = self
    controller.present { _ in }
  }

  func paymentAuthorizationControllerDidFinish(_ controller: PKPaymentAuthorizationController) {}
}

struct ContentView: View {
  var body: some View {
    Text("Pay")
  }
}
