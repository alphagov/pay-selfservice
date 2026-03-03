
import { PaymentDetailsData } from "@models/transaction/dto/PaymentDetails.dto"
import { CardDetailsFixture } from "../card-details/card-details.fixture"
import { ResourceType } from "@models/transaction/types/resource-type"

export class PaymentDetailsFixture {
  description: string
  reference: string
  email: string
  transactionType: ResourceType
  cardDetails: CardDetailsFixture

  constructor(options?: Partial<PaymentDetailsFixture>) {
    this.description = 'a test transaction'
    this.reference = 'transaction-reference'
    this.email = 'test2@example.org'
    this.transactionType = ResourceType.REFUND
    this.cardDetails = new CardDetailsFixture()

    if (options) {
      Object.assign(this, options)
    }
  }

  toPaymentDetailsData(): PaymentDetailsData {
    return {
      description: this.description,
      reference: this.reference,
      email: this.email,
      transaction_type: this.transactionType,
      card_details: this.cardDetails?.toCardDetailsData()
    }
  }

  // constructor(paymentDetails: PaymentDetailsData) {
  //   this.description = paymentDetails.description
  //   this.reference = paymentDetails.reference
  //   this.email = paymentDetails.email
  //   this.transactionType = paymentDetails.transaction_type
  //   this.cardDetails = new CardDetails(paymentDetails.card_details)
  // }
}