import { Task, Tasks } from '@models/task-workflows/Tasks.class'
import { AdyenTaskIdentifier } from '@models/task-workflows/task-identifiers/adyen-task-identifiers'
import TaskStatus from '@models/constants/task-status'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import Service from '@models/service/Service.class'
import GatewayAccount from '@models/gateway-account/GatewayAccount.class'
import { AdyenAccountSetup } from '@models/gateway-account/AdyenAccountSetup.class'
import GatewayAccountCredential from '@models/gateway-account-credential/GatewayAccountCredential.class'
import { PaymentProvider } from '@models/constants/payment-provider'

class AdyenTask extends Task {
  constructor(linkText: string, id: AdyenTaskIdentifier, href: string) {
    super(linkText, id, href)
  }

  // check the status of the given task
  private static checkStatus(ownCompleted: boolean, canStart: boolean) {
    if (!canStart) {
      return TaskStatus.CANNOT_START
    }
    return ownCompleted ? TaskStatus.COMPLETED_CANNOT_START : TaskStatus.NOT_STARTED
  }

  static organisationDetailsTask(
    service: Service,
    gatewayAccount: GatewayAccount,
    accountSetup: AdyenAccountSetup,
    switchingCredentialId: string
  ) {
    const status = AdyenTask.checkStatus(accountSetup.tasks.organisationDetails.status === 'COMPLETED', true)

    return new AdyenTask(
      'Organisation details',
      AdyenTaskIdentifier.ORG_DETAILS,
      formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.adyenDetails.organisationDetails.index,
        service.externalId,
        gatewayAccount.type,
        switchingCredentialId
      )
    ).setStatus(status)
  }

  static acceptLegalTermsTask(
    service: Service,
    gatewayAccount: GatewayAccount,
    accountSetup: AdyenAccountSetup,
    switchingCredentialId: string
  ) {
    const canStart = accountSetup.tasks.organisationDetails.status === 'COMPLETED'
    const status = AdyenTask.checkStatus(accountSetup.tasks.legalTerms.status === 'COMPLETED', canStart)

    return new AdyenTask(
      'Read and accept Adyen’s legal terms',
      AdyenTaskIdentifier.LEGAL_TERMS,
      formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.adyenDetails.legalTerms,
        service.externalId,
        gatewayAccount.type,
        switchingCredentialId
      )
    ).setStatus(status)
  }

  static bankDetailsTask(
    service: Service,
    gatewayAccount: GatewayAccount,
    accountSetup: AdyenAccountSetup,
    switchingCredentialId: string
  ) {
    const canStart = accountSetup.tasks.legalTerms.status === 'COMPLETED'
    const status = AdyenTask.checkStatus(accountSetup.tasks.bankDetails.status === 'COMPLETED', canStart)

    return new AdyenTask(
      'Organisation’s bank details',
      AdyenTaskIdentifier.BANK_DETAILS,
      formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.adyenDetails.bankDetails,
        service.externalId,
        gatewayAccount.type,
        switchingCredentialId
      )
    ).setStatus(status)
  }

  static responsiblePersonTask(
    service: Service,
    gatewayAccount: GatewayAccount,
    accountSetup: AdyenAccountSetup,
    switchingCredentialId: string
  ) {
    const canStart = accountSetup.tasks.legalTerms.status === 'COMPLETED'
    const status = AdyenTask.checkStatus(accountSetup.tasks.responsiblePerson.status === 'COMPLETED', canStart)

    return new AdyenTask(
      'Responsible person',
      AdyenTaskIdentifier.RESPONSIBLE_PERSON,
      formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.adyenDetails.responsiblePerson.index,
        service.externalId,
        gatewayAccount.type,
        switchingCredentialId
      )
    ).setStatus(status)
  }

  static serviceDirectorTask(
    service: Service,
    gatewayAccount: GatewayAccount,
    accountSetup: AdyenAccountSetup,
    switchingCredentialId: string
  ) {
    const canStart = accountSetup.tasks.legalTerms.status === 'COMPLETED'
    const status = AdyenTask.checkStatus(accountSetup.tasks.director.status === 'COMPLETED', canStart)

    return new AdyenTask(
      'Service director',
      AdyenTaskIdentifier.SERVICE_DIRECTOR,
      formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.adyenDetails.serviceDirector.details,
        service.externalId,
        gatewayAccount.type,
        switchingCredentialId
      )
    ).setStatus(status)
  }

  static statementDescriptorsTask(
    service: Service,
    gatewayAccount: GatewayAccount,
    accountSetup: AdyenAccountSetup,
    switchingCredentialId: string
  ) {
    const status = TaskStatus.NOT_STARTED

    return new AdyenTask(
      'Bank statement descriptors for your service',
      AdyenTaskIdentifier.STATEMENT_DESCRIPTORS,
      formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.adyenDetails.statementDescriptors.user,
        service.externalId,
        gatewayAccount.type,
        switchingCredentialId
      )
    ).setStatus(status)
  }

  static paymentTask(
    service: Service,
    gatewayAccount: GatewayAccount,
    accountSetup: AdyenAccountSetup,
    switchingCredential: GatewayAccountCredential,
    requiredTasks: AdyenTask[]
  ) {
    const requiredTasksCompleted = !requiredTasks.some(
      (task) => task.status === TaskStatus.NOT_STARTED || task.status === TaskStatus.CANNOT_START
    )
    const paymentCompleted = switchingCredential.state === 'VERIFIED_WITH_LIVE_PAYMENT'
    const status = paymentCompleted
      ? TaskStatus.COMPLETED_CANNOT_START
      : requiredTasksCompleted
        ? TaskStatus.NOT_STARTED
        : TaskStatus.CANNOT_START

    return new AdyenTask(
      'Make a £1 payment using a debit or credit card',
      AdyenTaskIdentifier.PAYMENT,
      formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.switchPsp.switchToAdyen.index,
        service.externalId,
        gatewayAccount.type,
        switchingCredential.externalId
      )
    ).setStatus(status)
  }

  static finishSwitchingTask(
    service: Service,
    gatewayAccount: GatewayAccount,
    accountSetup: AdyenAccountSetup,
    switchingCredential: GatewayAccountCredential
  ) {
    const paymentCompleted = switchingCredential.state === 'VERIFIED_WITH_LIVE_PAYMENT'
    const status = paymentCompleted ? TaskStatus.NOT_STARTED : TaskStatus.CANNOT_START

    return new AdyenTask(
      'Finish switching to Adyen',
      AdyenTaskIdentifier.FINISH_SWITCHING,
      formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.switchPsp.switchToAdyen.index,
        service.externalId,
        gatewayAccount.type,
        switchingCredential.externalId
      )
    ).setStatus(status)
  }
}

export class AdyenTasks extends Tasks<AdyenTask> {
  confirmOrganisationTasks: AdyenTask[]
  acceptLegalTermsTasks: AdyenTask[]
  completeOrganisationDetailsTasks: AdyenTask[]
  completeFinalTasks: AdyenTask[]

  constructor(
    confirmOrganisationTasks: AdyenTask[],
    acceptLegalTermsTasks: AdyenTask[],
    completeOrganisationDetailsTasks: AdyenTask[],
    completeFinalTasks: AdyenTask[]
  ) {
    super([...confirmOrganisationTasks, ...acceptLegalTermsTasks, ...completeOrganisationDetailsTasks])
    this.confirmOrganisationTasks = confirmOrganisationTasks
    this.acceptLegalTermsTasks = acceptLegalTermsTasks
    this.completeOrganisationDetailsTasks = completeOrganisationDetailsTasks
    this.completeFinalTasks = completeFinalTasks
  }

  static forProviderSwitching(service: Service, gatewayAccount: GatewayAccount, accountSetup: AdyenAccountSetup) {
    const switchingCredential = gatewayAccount.getSwitchingCredential()

    const confirmOrganisationTasks = [
      AdyenTask.organisationDetailsTask(service, gatewayAccount, accountSetup, switchingCredential.externalId),
    ]
    const acceptLegalTermsTasks = [
      AdyenTask.acceptLegalTermsTask(service, gatewayAccount, accountSetup, switchingCredential.externalId),
    ]
    const completeOrganisationDetailsTasks = [
      AdyenTask.bankDetailsTask(service, gatewayAccount, accountSetup, switchingCredential.externalId),
      AdyenTask.responsiblePersonTask(service, gatewayAccount, accountSetup, switchingCredential.externalId),
      AdyenTask.serviceDirectorTask(service, gatewayAccount, accountSetup, switchingCredential.externalId),
    ]
    // if the service is switching from Stripe, this task is not required
    if (gatewayAccount.getActiveCredential()?.paymentProvider !== PaymentProvider.STRIPE) {
      completeOrganisationDetailsTasks.push(
        AdyenTask.statementDescriptorsTask(service, gatewayAccount, accountSetup, switchingCredential.externalId)
      )
    }

    const completeFinalTasks = [
      AdyenTask.paymentTask(
        service,
        gatewayAccount,
        accountSetup,
        switchingCredential,
        completeOrganisationDetailsTasks
      ),
      AdyenTask.finishSwitchingTask(service, gatewayAccount, accountSetup, switchingCredential),
    ]
    return new AdyenTasks(
      confirmOrganisationTasks,
      acceptLegalTermsTasks,
      completeOrganisationDetailsTasks,
      completeFinalTasks
    )
  }
}
