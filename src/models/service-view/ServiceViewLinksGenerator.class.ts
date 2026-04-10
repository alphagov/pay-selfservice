import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'

export class ServiceViewLinksGenerator {
  readonly serviceExternalId: string
  readonly accountType: string
  readonly transactions: ServiceTransactionLinks
  readonly settings: ServiceSettingsLinks

  constructor(serviceExternalId: string, accountType: string) {
    this.serviceExternalId = serviceExternalId

    this.transactions = new ServiceTransactionLinks(this)
    this.settings = new ServiceSettingsLinks(this)
    this.accountType = accountType
  }
}

class ServiceTransactionLinks {
  private readonly serviceViewGenerator: ServiceViewLinksGenerator
  constructor(serviceViewGenerator: ServiceViewLinksGenerator) {
    this.serviceViewGenerator = serviceViewGenerator
  }

  get downloadCsv() {
    return formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.transactions.downloadCsv,
      this.serviceViewGenerator.serviceExternalId,
      this.serviceViewGenerator.accountType
    )
  }
}

class ServiceSettingsLinks {
  private readonly serviceViewGenerator: ServiceViewLinksGenerator
  private readonly teamMembers: TeamMembersSettingsLinks

  constructor(serviceViewGenerator: ServiceViewLinksGenerator) {
    this.serviceViewGenerator = serviceViewGenerator

    this.teamMembers = new TeamMembersSettingsLinks(serviceViewGenerator)
  }
}

class TeamMembersSettingsLinks {
  private readonly serviceViewGenerator: ServiceViewLinksGenerator

  constructor(serviceViewGenerator: ServiceViewLinksGenerator) {
    this.serviceViewGenerator = serviceViewGenerator
  }

  get index() {
    return formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.teamMembers.index,
      this.serviceViewGenerator.serviceExternalId,
      this.serviceViewGenerator.accountType
    )
  }
}
