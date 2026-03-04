import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'

export class ServiceLinksGenerator {
  readonly serviceExternalId: string
  accountType?: string
  readonly transactions: ServiceTransactionLinks

  constructor(serviceExternalId: string) {
    this.serviceExternalId = serviceExternalId

    this.transactions = new ServiceTransactionLinks(this)
  }

  bind(accountType: string) {
    this.accountType = accountType
  }
}

class ServiceTransactionLinks {
  private readonly serviceGenerator: ServiceLinksGenerator
  constructor(serviceGenerator: ServiceLinksGenerator) {
    this.serviceGenerator = serviceGenerator
  }

  get downloadCsv() {
    return formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.transactions.downloadCsv,
      this.serviceGenerator.serviceExternalId,
      this.serviceGenerator.accountType!
    )
  }
}
