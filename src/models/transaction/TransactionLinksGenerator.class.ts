import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import formattedPathFor from '@utils/simplified-account/format/format-paths-for'

export class TransactionLinksGenerator {
  readonly transactionId: string
  serviceExternalId?: string
  accountType?: string
  allServiceView?: boolean

  constructor(transactionId: string) {
    this.transactionId = transactionId
  }

  bind(serviceExternalId: string, accountType: string) {
    this.serviceExternalId = serviceExternalId
    this.accountType = accountType
  }

  bindToAllServices() {
    this.allServiceView = true
  }

  get detail() {
    return this.allServiceView
      ? formattedPathFor(paths.allServiceTransactions.simplifiedAccount.detail, this.transactionId)
      : formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.transactions.detail,
          this.serviceExternalId!,
          this.accountType!,
          this.transactionId
        )
  }

  get refund() {
    return this.allServiceView
      ? formattedPathFor(paths.allServiceTransactions.simplifiedAccount.refund, this.transactionId)
      : formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.transactions.refund,
          this.serviceExternalId!,
          this.accountType!,
          this.transactionId
        )
  }
}
