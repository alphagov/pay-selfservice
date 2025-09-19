import { TransactionData } from '@models/ledger/dto/Transaction.dto'
import { DateTime } from 'luxon'
import { penceToPoundsWithCurrency } from '@utils/currency-formatter'

class Transaction {
  // INFO: this is not a complete class yet, see TransactionData interface
  readonly gatewayAccountId: string
  readonly serviceExternalId: string
  readonly transactionExternalId: string
  readonly gatewayTransactionId: string
  readonly reference: string
  readonly state: {
    finished: boolean
    status: string
  }
  readonly amount: number // pence
  readonly createdDate: DateTime
  readonly email: string
  readonly cardBrand?: string

  constructor(data: TransactionData) {
    this.gatewayAccountId = data.gateway_account_id
    this.serviceExternalId = data.service_id
    this.transactionExternalId = data.transaction_id
    this.gatewayTransactionId = data.gateway_transaction_id
    this.reference = data.reference
    this.state = data.state
    this.amount = data.amount
    this.createdDate = DateTime.fromISO(data.created_date)
    this.email = data.email
    this.cardBrand = data.card_details?.card_brand
  }

  amountInPounds(): string {
    return penceToPoundsWithCurrency(this.amount)
  }
}

export {
  Transaction
}
