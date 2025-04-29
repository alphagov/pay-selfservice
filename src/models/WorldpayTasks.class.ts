import GatewayAccount from '@models/GatewayAccount.class'
import paths from '@root/paths'
import { ConnectorClient } from '@services/clients/connector.client'
import TaskStatus from '@models/constants/task-status'
import CredentialState from '@models/constants/credential-state'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import GatewayAccountCredential from '@models/gateway-account-credential/GatewayAccountCredential.class'
import { Task, Tasks } from '@models/task-workflows/Tasks.class'
import { WORLDPAY } from '@models/constants/payment-providers'

const connectorClient = new ConnectorClient(process.env.CONNECTOR_URL!)

class WorldpayTasks extends Tasks<WorldpayTask> {
  constructor(gatewayAccount: GatewayAccount, serviceExternalId: string) {
    super(WorldpayTasks.generateTasks(gatewayAccount, serviceExternalId))
  }

  hasRecurringTasks() {
    return this.tasks.find((t) => t.id === 'worldpay-cit-credentials') && this.tasks.find((t) => t.id === 'worldpay-mit-credentials')
  }

  static async recalculate(serviceExternalId: string, accountType: string) {
    const gatewayAccount = await connectorClient.getAccountByServiceExternalIdAndAccountType({
      serviceExternalId,
      accountType,
    })
    return new WorldpayTasks(gatewayAccount, serviceExternalId)
  }

  private static generateTasks(gatewayAccount: GatewayAccount, serviceExternalId: string) {
    const tasks: WorldpayTask[] = []
    const switchingPsp = gatewayAccount.providerSwitchEnabled && gatewayAccount.paymentProvider !== WORLDPAY
    const credential = switchingPsp ? gatewayAccount.getSwitchingCredential() : gatewayAccount.getCurrentCredential()

    if (gatewayAccount.recurringEnabled) {
      tasks.push(WorldpayTask.recurringCustomerInitiatedCredentialsTask(serviceExternalId, gatewayAccount, credential))
      tasks.push(WorldpayTask.recurringMerchantInitiatedCredentialsTask(serviceExternalId, gatewayAccount, credential))
    } else {
      tasks.push(WorldpayTask.oneOffCustomerInitiatedCredentialsTask(serviceExternalId, gatewayAccount, credential))
    }

    if (!gatewayAccount.allowMoto) {
      tasks.push(WorldpayTask.flexCredentialsTask(serviceExternalId, gatewayAccount))
    }

    if (switchingPsp) {
      tasks.push(WorldpayTask.makeALivePaymentTask(serviceExternalId, gatewayAccount))
    }

    return tasks
  }
}

class WorldpayTask extends Task {
  constructor(linkText: string, id: string, href: string) {
    super(linkText, id, href)
  }

  static flexCredentialsTask(serviceExternalId: string, gatewayAccount: GatewayAccount) {
    const task = new WorldpayTask(
      'Configure 3DS',
      'worldpay-3ds-flex-credentials',
      formatServiceAndAccountPathsFor(
        gatewayAccount.providerSwitchEnabled
          ? paths.simplifiedAccount.settings.switchPsp.switchToWorldpay.flexCredentials
          : paths.simplifiedAccount.settings.worldpayDetails.flexCredentials,
        serviceExternalId,
        gatewayAccount.type
      )
    )

    if (gatewayAccount.worldpay3dsFlex) {
      task.setStatus(TaskStatus.COMPLETED)
    } else {
      task.setStatus(TaskStatus.NOT_STARTED)
    }

    return task
  }

  static recurringCustomerInitiatedCredentialsTask(
    serviceExternalId: string,
    gatewayAccount: GatewayAccount,
    credential: GatewayAccountCredential | undefined
  ) {
    const task = new WorldpayTask(
      'Recurring customer initiated transaction (CIT) credentials',
      'worldpay-cit-credentials',
      formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.worldpayDetails.recurringCustomerInitiated,
        serviceExternalId,
        gatewayAccount.type
      )
    )
    if (!credential?.credentials?.recurringCustomerInitiated) {
      task.setStatus(TaskStatus.NOT_STARTED)
    } else {
      task.setStatus(TaskStatus.COMPLETED)
    }

    return task
  }

  static recurringMerchantInitiatedCredentialsTask(
    serviceExternalId: string,
    gatewayAccount: GatewayAccount,
    credential: GatewayAccountCredential | undefined
  ) {
    const task = new WorldpayTask(
      'Recurring merchant initiated transaction (MIT) credentials',
      'worldpay-mit-credentials',
      formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.worldpayDetails.recurringMerchantInitiated,
        serviceExternalId,
        gatewayAccount.type
      )
    )
    if (!credential?.credentials?.recurringMerchantInitiated) {
      task.setStatus(TaskStatus.NOT_STARTED)
    } else {
      task.setStatus(TaskStatus.COMPLETED)
    }

    return task
  }

  static oneOffCustomerInitiatedCredentialsTask(
    serviceExternalId: string,
    gatewayAccount: GatewayAccount,
    credential: GatewayAccountCredential | undefined
  ) {
    const task = new WorldpayTask(
      'Link your Worldpay account with GOV.UK Pay',
      'worldpay-credentials',
      formatServiceAndAccountPathsFor(
        gatewayAccount.providerSwitchEnabled
          ? paths.simplifiedAccount.settings.switchPsp.switchToWorldpay.oneOffCustomerInitiated
          : paths.simplifiedAccount.settings.worldpayDetails.oneOffCustomerInitiated,
        serviceExternalId,
        gatewayAccount.type
      )
    )
    if (!credential?.credentials?.oneOffCustomerInitiated) {
      task.setStatus(TaskStatus.NOT_STARTED)
    } else if (credential.state === CredentialState.VERIFIED) {
      task.setStatus(TaskStatus.COMPLETED_CANNOT_START)
    } else {
      task.setStatus(TaskStatus.COMPLETED)
    }

    return task
  }

  static makeALivePaymentTask(serviceExternalId: string, gatewayAccount: GatewayAccount) {
    const task = new WorldpayTask(
      'Make a live payment to test your Worldpay PSP',
      'make-a-live-payment',
      formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.switchPsp.switchToWorldpay.makeTestPayment.outbound,
        serviceExternalId,
        gatewayAccount.type
      )
    )

    const credential = gatewayAccount.getSwitchingCredential()

    if (!credential?.credentials?.oneOffCustomerInitiated) {
      task.setStatus(TaskStatus.CANNOT_START)
    }

    if (credential.state === CredentialState.VERIFIED) {
      task.setStatus(TaskStatus.COMPLETED_CANNOT_START)
    }

    // For non-MOTO accounts, require flex credentials to be set
    if (!gatewayAccount.allowMoto && !gatewayAccount.worldpay3dsFlex) {
      task.setStatus(TaskStatus.CANNOT_START)
    }

    return task
  }
}

export = WorldpayTasks
