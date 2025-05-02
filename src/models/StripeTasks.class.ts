import GatewayAccount from '@models/GatewayAccount.class'
import StripeAccountSetup from '@models/StripeAccountSetup.class'
import TaskStatus from '@models/constants/task-status'
import paths from '@root/paths'
import CredentialState from '@models/constants/credential-state'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import { Tasks, Task } from '@models/task-workflows/Tasks.class'
import { STRIPE } from '@models/constants/payment-providers'

class StripeTasks extends Tasks<StripeTask> {
  constructor(
    stripeAccountSetup: StripeAccountSetup,
    gatewayAccount: GatewayAccount,
    serviceExternalId: string
  ) {
    super(StripeTasks.generateTasks(stripeAccountSetup, gatewayAccount, serviceExternalId))
  }

  private static generateTasks(
    stripeAccountSetup: StripeAccountSetup,
    gatewayAccount: GatewayAccount,
    serviceExternalId: string
  ) {
    const tasks = [
      StripeTask.bankAccountTask(stripeAccountSetup, serviceExternalId, gatewayAccount),
      StripeTask.responsiblePersonTask(stripeAccountSetup, serviceExternalId, gatewayAccount),
      StripeTask.directorTask(stripeAccountSetup, serviceExternalId, gatewayAccount),
      StripeTask.vatNumberTask(stripeAccountSetup, serviceExternalId, gatewayAccount),
      StripeTask.companyNumberTask(stripeAccountSetup, serviceExternalId, gatewayAccount),
      StripeTask.organisationDetailsTask(stripeAccountSetup, serviceExternalId, gatewayAccount),
      StripeTask.governmentEntityDocumentTask(stripeAccountSetup, serviceExternalId, gatewayAccount),
    ]

    if (gatewayAccount.providerSwitchEnabled && gatewayAccount.paymentProvider !== STRIPE) {
      tasks.push(StripeTask.makeALivePaymentTask(stripeAccountSetup, serviceExternalId, gatewayAccount))
    }

    return tasks
  }
}

class StripeTask extends Task {
  constructor(linkText: string, id: string, href: string) {
    super(linkText, id, href)
  }

  static bankAccountTask(
    stripeAccountSetup: StripeAccountSetup,
    serviceExternalId: string,
    gatewayAccount: GatewayAccount
  ) {
    const task = new StripeTask(
      "Organisation's bank details",
      'stripe-bank-details',
      formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.stripeDetails.bankDetails,
        serviceExternalId,
        gatewayAccount.type
      )
    )

    if (stripeAccountSetup.bankAccount) {
      task.setStatus(TaskStatus.COMPLETED_CANNOT_START)
    }

    return task
  }

  static responsiblePersonTask(
    stripeAccountSetup: StripeAccountSetup,
    serviceExternalId: string,
    gatewayAccount: GatewayAccount
  ) {
    const task = new StripeTask(
      'Responsible person',
      'stripe-responsible-person',
      formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.stripeDetails.responsiblePerson.index,
        serviceExternalId,
        gatewayAccount.type
      )
    )

    if (stripeAccountSetup.responsiblePerson) {
      task.setStatus(TaskStatus.COMPLETED_CANNOT_START)
    }

    return task
  }

  static directorTask(
    stripeAccountSetup: StripeAccountSetup,
    serviceExternalId: string,
    gatewayAccount: GatewayAccount
  ) {
    const task = new StripeTask(
      'Service director',
      'stripe-service-director',
      formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.stripeDetails.director,
        serviceExternalId,
        gatewayAccount.type
      )
    )

    if (stripeAccountSetup.director) {
      task.setStatus(TaskStatus.COMPLETED_CANNOT_START)
    }

    return task
  }

  static vatNumberTask(
    stripeAccountSetup: StripeAccountSetup,
    serviceExternalId: string,
    gatewayAccount: GatewayAccount
  ) {
    const task = new StripeTask(
      'VAT registration number',
      'stripe-vat-number',
      formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.stripeDetails.vatNumber,
        serviceExternalId,
        gatewayAccount.type
      )
    )

    if (stripeAccountSetup.vatNumber) {
      task.setStatus(TaskStatus.COMPLETED_CANNOT_START)
    }

    return task
  }

  static companyNumberTask(
    stripeAccountSetup: StripeAccountSetup,
    serviceExternalId: string,
    gatewayAccount: GatewayAccount
  ) {
    const task = new StripeTask(
      'Company registration number',
      'stripe-company-number',
      formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.stripeDetails.companyNumber,
        serviceExternalId,
        gatewayAccount.type
      )
    )

    if (stripeAccountSetup.companyNumber) {
      task.setStatus(TaskStatus.COMPLETED_CANNOT_START)
    }

    return task
  }

  static organisationDetailsTask(
    stripeAccountSetup: StripeAccountSetup,
    serviceExternalId: string,
    gatewayAccount: GatewayAccount
  ) {
    const task = new StripeTask(
      "Confirm your organisation's name and address match your government entity document",
      'stripe-org-details',
      formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.stripeDetails.organisationDetails.index,
        serviceExternalId,
        gatewayAccount.type
      )
    )

    if (stripeAccountSetup.organisationDetails) {
      task.setStatus(TaskStatus.COMPLETED_CANNOT_START)
    }

    return task
  }

  static governmentEntityDocumentTask(
    stripeAccountSetup: StripeAccountSetup,
    serviceExternalId: string,
    gatewayAccount: GatewayAccount
  ) {
    const task = new StripeTask(
      'Government entity document',
      'stripe-gov-entity-doc',
      formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.stripeDetails.governmentEntityDocument,
        serviceExternalId,
        gatewayAccount.type
      )
    )

    if (!stripeAccountSetup.entityDocTaskAvailable()) {
      task.setStatus(TaskStatus.CANNOT_START)
    }

    if (stripeAccountSetup.governmentEntityDocument) {
      task.setStatus(TaskStatus.COMPLETED_CANNOT_START)
    }

    return task
  }

  static makeALivePaymentTask(
    stripeAccountSetup: StripeAccountSetup,
    serviceExternalId: string,
    gatewayAccount: GatewayAccount
  ) {
    const task = new StripeTask(
      'Make a live payment to test your Stripe PSP',
      'make-a-live-payment',
      formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.switchPsp.makeTestPayment.outbound,
        serviceExternalId,
        gatewayAccount.type
      )
    )

    const credential = gatewayAccount.getSwitchingCredential()

    // stripe needs to send connector a notification that all is well before the credential state is updated to ENTERED
    if (!stripeAccountSetup.setupCompleted() || credential.state === CredentialState.CREATED) {
      task.setStatus(TaskStatus.CANNOT_START)
    }

    if (credential.state === CredentialState.VERIFIED) {
      task.setStatus(TaskStatus.COMPLETED_CANNOT_START)
    }

    return task
  }
}

export = StripeTasks
