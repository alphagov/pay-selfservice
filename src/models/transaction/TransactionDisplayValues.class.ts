import { Transaction } from '@models/transaction/Transaction.class'
import { penceToPoundsWithCurrency } from '@utils/currency-formatter'
import { getFriendlyStatus, Status } from '@models/transaction/types/status'
import changeCase from 'change-case'
import { ReasonFriendlyNames } from '@models/transaction/types/reason'
import { ResourceType } from '@models/transaction/types/resource-type'
import { DATE_TIME, ZONED_DATE_TIME } from '@models/constants/time-formats'

export class TransactionDisplayValues {
  private readonly transaction: Transaction
  private readonly isRefund: boolean
  private readonly isDispute: boolean

  constructor(transaction: Transaction) {
    this.transaction = transaction

    this.isRefund = transaction.transactionType === ResourceType.REFUND
    this.isDispute = transaction.transactionType === ResourceType.DISPUTE
  }

  get amount(): string {
    return penceToPoundsWithCurrency(this.transaction.amount)
  }

  get netAmount(): string {
    return this.transaction.netAmount ? penceToPoundsWithCurrency(this.transaction.netAmount) : ''
  }

  get totalAmount(): string {
    return this.transaction.totalAmount ? penceToPoundsWithCurrency(this.transaction.totalAmount) : ''
  }

  get refundedAmount(): string {
    return this.transaction.refundSummary
      ? penceToPoundsWithCurrency(this.transaction.refundSummary.amountRefunded)
      : ''
  }

  get signedAmount(): string {
    if (this.isDispute && this.transaction.state.status === Status.WON) {
      return penceToPoundsWithCurrency(this.transaction.amount)
    }

    if (this.isRefund || this.isDispute) {
      return penceToPoundsWithCurrency(-this.transaction.amount)
    }

    return penceToPoundsWithCurrency(this.transaction.amount)
  }

  get fee(): string {
    return this.transaction.fee ? penceToPoundsWithCurrency(this.transaction.fee) : ''
  }

  get corporateCardSurcharge(): string {
    return this.transaction.corporateCardSurcharge
      ? penceToPoundsWithCurrency(this.transaction.corporateCardSurcharge)
      : ''
  }

  get cardNumber(): string {
    return this.transaction.cardDetails ? `•••• ${this.transaction.cardDetails.lastDigitsCardNumber}` : ''
  }

  get createdDate(): string {
    return this.transaction.createdDate.toFormat(DATE_TIME)
  }

  get createdDateWithOffset(): string {
    const offset = this.transaction.createdDate.setLocale('en-GB').isInDST ? ' (BST)' : ' (GMT)'
    return this.createdDate + offset
  }

  get zonedCreatedDate(): string {
    return this.transaction.createdDate.toFormat(ZONED_DATE_TIME)
  }

  get email(): string {
    return (this.isRefund ? this.transaction.paymentDetails!.email : this.transaction.email) ?? ''
  }

  get paymentProvider(): string {
    return changeCase.upperCaseFirst(this.transaction.paymentProvider)
  }

  // reference for the parent payment if refund or dispute
  get paymentReference(): string {
    return this.isRefund || this.isDispute ? this.transaction.paymentDetails!.reference : this.transaction.reference
  }

  get paymentType(): string {
    return this.transaction.walletType ? changeCase.titleCase(this.transaction.walletType) : 'Card'
  }

  get status(): string | undefined {
    return getFriendlyStatus(this.transaction.transactionType, this.transaction.state.status)
  }

  get evidenceDueDate(): string {
    const offset = this.transaction.evidenceDueDate?.setLocale('en-GB').isInDST ? ' (BST)' : ' (GMT)'
    return this.transaction.evidenceDueDate ? this.transaction.evidenceDueDate.toFormat(DATE_TIME) + offset : ''

    // return this.transaction.evidenceDueDate
    //   ? this.transaction.evidenceDueDate
    //     .toFormat(ZONED_DATE_TIME)
    //     .replace('(+0000)', '(GMT)')
    //     .replace('(+0100)', '(BST)')
    //   : ''
  }

  get disputeReason(): string {
    return this.transaction.reason !== undefined
      ? (ReasonFriendlyNames[this.transaction.reason] ?? ReasonFriendlyNames.OTHER)
      : ''
  }
}
