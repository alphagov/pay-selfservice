import { Transaction } from '@models/transaction/Transaction.class'
import { penceToPoundsWithCurrency } from '@utils/currency-formatter'
import { getFriendlyStatus } from '@models/transaction/types/status'
import changeCase from 'change-case'
import { ReasonFriendlyNames } from '@models/transaction/types/reason'

export class TransactionDisplayValues {
  readonly fee: string
  readonly amount: string
  readonly amountInPounds: string
  readonly totalAmount: string
  readonly netAmount: string
  readonly refundedAmount: string
  readonly corporateCardSurcharge: string
  readonly email: string | undefined
  readonly reference: string
  readonly status: string | undefined
  readonly createdDate: string
  readonly paymentType: string
  readonly cardNumber: string
  readonly paymentProvider: string
  readonly evidenceDueDate: string
  readonly disputeReason?: string

  private readonly transaction: Transaction

  constructor(transaction: Transaction) {
    this.transaction = transaction

    const isRefund = transaction.transactionType === 'REFUND'
    const isWonDispute = transaction.transactionType === 'DISPUTE' && transaction.state.status === 'WON'

    this.fee = transaction.fee ? penceToPoundsWithCurrency(transaction.fee) : ''
    this.amount = penceToPoundsWithCurrency(transaction.amount)
    this.amountInPounds =
      isRefund || isWonDispute
        ? penceToPoundsWithCurrency(-transaction.amount)
        : penceToPoundsWithCurrency(transaction.amount)
    this.netAmount = transaction.netAmount ? penceToPoundsWithCurrency(transaction.netAmount) : ''
    this.totalAmount = transaction.totalAmount ? penceToPoundsWithCurrency(transaction.totalAmount) : ''
    this.refundedAmount = transaction.refundSummary
      ? penceToPoundsWithCurrency(transaction.refundSummary.amountRefunded)
      : ''
    this.corporateCardSurcharge = transaction.corporateCardSurcharge
      ? penceToPoundsWithCurrency(transaction.corporateCardSurcharge)
      : ''
    this.email = isRefund ? transaction.paymentDetails!.email : transaction.email
    this.reference = isRefund ? transaction.paymentDetails!.reference : transaction.reference
    this.status = getFriendlyStatus(transaction.transactionType, transaction.state.status)
    this.createdDate = transaction.createdDate.toFormat('dd LLL yyyy HH:mm:ss')
    this.paymentType = transaction.walletType ? changeCase.titleCase(transaction.walletType) : 'Card'
    this.cardNumber = transaction.cardDetails ? `•••• ${transaction.cardDetails.lastDigitsCardNumber}` : ''
    this.paymentProvider = changeCase.upperCaseFirst(transaction.paymentProvider)

    this.evidenceDueDate = transaction.evidenceDueDate
      ? transaction.evidenceDueDate.toFormat('dd LLL yyyy HH:mm:ss')
      : ''

    if (this.transaction.reason !== undefined) {
      this.disputeReason = ReasonFriendlyNames[this.transaction.reason] ?? ReasonFriendlyNames.OTHER
    }
  }
}
