import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'

export class TransactionLinksGenerator {
  readonly transactionId: string
  serviceExternalId?: string
  accountType?: string

  constructor(transactionId: string) {
    this.transactionId = transactionId
  }

  bind(serviceExternalId: string, accountType: string) {
    this.serviceExternalId = serviceExternalId
    this.accountType = accountType
  }

  get detail() {
    return formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.transactions.detail,
      this.serviceExternalId!,
      this.accountType!,
      this.transactionId
    )
  }

  get refund() {
    return formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.transactions.refund,
      this.serviceExternalId!,
      this.accountType!,
      this.transactionId
    )
  }
}
