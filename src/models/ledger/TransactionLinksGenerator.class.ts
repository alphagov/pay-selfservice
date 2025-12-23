import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'

export class TransactionLinksGenerator {
  readonly transactionId: string

  constructor(transactionId: string) {
    this.transactionId = transactionId
  }

  detail(serviceExternalId: string, accountType: string) {
    return formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.transactions.detail,
      serviceExternalId,
      accountType,
      this.transactionId
    )
  }
}
