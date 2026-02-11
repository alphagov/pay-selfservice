import { ResourceType } from '@models/transaction/types/resource-type'
import { CardDetails } from '@models/common/card-details/CardDetails.class'
import { PaymentDetailsData } from '@models/transaction/dto/PaymentDetails.dto'

// the return type of payment_details in Ledger's API spec is `TransactionView`
// however in reality Ledger does not return a full Transaction record for the payment_details field
export class PaymentDetails {
  readonly description: string
  readonly reference: string
  readonly email: string
  readonly transactionType: ResourceType
  readonly cardDetails: CardDetails

  constructor(paymentDetails: PaymentDetailsData) {
    this.description = paymentDetails.description
    this.reference = paymentDetails.reference
    this.email = paymentDetails.email
    this.transactionType = paymentDetails.transaction_type
    this.cardDetails = new CardDetails(paymentDetails.card_details)
  }
}
