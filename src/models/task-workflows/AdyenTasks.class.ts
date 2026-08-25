import { Task, Tasks } from '@models/task-workflows/Tasks.class'
import { AdyenTaskIdentifier } from '@models/task-workflows/task-identifiers/adyen-task-identifiers'
import TaskStatus from '@models/constants/task-status'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import Service from '@models/service/Service.class'
import GatewayAccount from '@models/gateway-account/GatewayAccount.class'

class AdyenTask extends Task {
  constructor(linkText: string, id: AdyenTaskIdentifier, href: string) {
    super(linkText, id, href)
  }

  static organisationDetailsTask(service: Service, gatewayAccount: GatewayAccount) {
    return new AdyenTask(
      'Organisation details',
      AdyenTaskIdentifier.ORG_DETAILS,
      formatServiceAndAccountPathsFor(paths.simplifiedAccount.settings.index, service.externalId, gatewayAccount.type)
    ).setStatus(TaskStatus.NOT_STARTED)
  }

  static acceptLegalTermsTask(service: Service, gatewayAccount: GatewayAccount) {
    return new AdyenTask(
      'Read and accept Adyen’s legal terms',
      AdyenTaskIdentifier.LEGAL_TERMS,
      formatServiceAndAccountPathsFor(paths.simplifiedAccount.settings.index, service.externalId, gatewayAccount.type)
    ).setStatus(TaskStatus.NOT_STARTED)
  }

  static bankDetailsTask(service: Service, gatewayAccount: GatewayAccount) {
    const switchingCredentialId = gatewayAccount.getSwitchingCredential().externalId

    return new AdyenTask(
      'Organisation’s bank details',
      AdyenTaskIdentifier.BANK_DETAILS,
      formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.adyenDetails.bankDetails,
        service.externalId,
        gatewayAccount.type,
        switchingCredentialId
      )
    ).setStatus(TaskStatus.NOT_STARTED)
  }

  static responsiblePersonTask(service: Service, gatewayAccount: GatewayAccount) {
    return new AdyenTask(
      'Responsible person',
      AdyenTaskIdentifier.RESPONSIBLE_PERSON,
      formatServiceAndAccountPathsFor(paths.simplifiedAccount.settings.index, service.externalId, gatewayAccount.type)
    ).setStatus(TaskStatus.NOT_STARTED)
  }

  static serviceDirectorTask(service: Service, gatewayAccount: GatewayAccount) {
    return new AdyenTask(
      'Service director',
      AdyenTaskIdentifier.SERVICE_DIRECTOR,
      formatServiceAndAccountPathsFor(paths.simplifiedAccount.settings.index, service.externalId, gatewayAccount.type)
    ).setStatus(TaskStatus.NOT_STARTED)
  }

  static reasonForTakingPaymentsTask(service: Service, gatewayAccount: GatewayAccount) {
    return new AdyenTask(
      'Tell us why your service takes payments',
      AdyenTaskIdentifier.REASON_FOR_TAKING_PAYMENTS,
      formatServiceAndAccountPathsFor(paths.simplifiedAccount.settings.index, service.externalId, gatewayAccount.type)
    ).setStatus(TaskStatus.NOT_STARTED)
  }
}

export class AdyenTasks extends Tasks<AdyenTask> {
  confirmOrganisationTasks: AdyenTask[]
  acceptLegalTermsTasks: AdyenTask[]
  completeOrganisationDetailsTasks: AdyenTask[]

  constructor(
    confirmOrganisationTasks: AdyenTask[],
    acceptLegalTermsTasks: AdyenTask[],
    completeOrganisationDetailsTasks: AdyenTask[]
  ) {
    super([...confirmOrganisationTasks, ...acceptLegalTermsTasks, ...completeOrganisationDetailsTasks])
    this.confirmOrganisationTasks = confirmOrganisationTasks
    this.acceptLegalTermsTasks = acceptLegalTermsTasks
    this.completeOrganisationDetailsTasks = completeOrganisationDetailsTasks
  }

  static forProviderSwitching(service: Service, gatewayAccount: GatewayAccount) {
    const confirmOrganisationTasks = [AdyenTask.organisationDetailsTask(service, gatewayAccount)]
    const acceptLegalTermsTasks = [AdyenTask.acceptLegalTermsTask(service, gatewayAccount)]
    const completeOrganisationDetailsTasks = [
      AdyenTask.bankDetailsTask(service, gatewayAccount),
      AdyenTask.responsiblePersonTask(service, gatewayAccount),
      AdyenTask.serviceDirectorTask(service, gatewayAccount),
      AdyenTask.reasonForTakingPaymentsTask(service, gatewayAccount),
    ]
    return new AdyenTasks(confirmOrganisationTasks, acceptLegalTermsTasks, completeOrganisationDetailsTasks)
  }
}
