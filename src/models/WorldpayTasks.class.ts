import GatewayAccount from '@models/gateway-account/GatewayAccount.class'
import paths from '@root/paths'
import ConnectorClient from '@services/clients/pay/ConnectorClient.class'
import TaskStatus from '@models/constants/task-status'
import CredentialState from '@models/constants/credential-state'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import GatewayAccountCredential from '@models/gateway-account-credential/GatewayAccountCredential.class'
import { Task, Tasks } from '@models/task-workflows/Tasks.class'

const connectorClient = new ConnectorClient()

const WORLDPAY_TASKS = {
  CIT: 'worldpay-cit-credentials',
  MIT: 'worldpay-mit-credentials',
  FLEX: 'worldpay-3ds-flex-credentials',
  CRED: 'worldpay-credentials',
  PAYMENT: 'make-a-live-payment',
}

const pendingCredentialStates = [CredentialState.CREATED, CredentialState.ENTERED, CredentialState.VERIFIED]

class WorldpayTasks extends Tasks<WorldpayTask> {
  constructor(gatewayAccount: GatewayAccount, serviceExternalId: string, credential: GatewayAccountCredential) {
    super(WorldpayTasks.generateTasks(gatewayAccount, serviceExternalId, credential))
  }

  hasRecurringTasks() {
    return [WORLDPAY_TASKS.CIT, WORLDPAY_TASKS.MIT].every((id) => this.tasks.some((t) => t.id === id))
  }

  static async recalculate(serviceExternalId: string, accountType: string, credential: GatewayAccountCredential) {
    const gatewayAccount = await connectorClient.gatewayAccounts.getByServiceExternalIdAndAccountType(
      serviceExternalId,
      accountType
    )
    return new WorldpayTasks(gatewayAccount, serviceExternalId, credential)
  }

  private static generateTasks(
    gatewayAccount: GatewayAccount,
    serviceExternalId: string,
    credential: GatewayAccountCredential
  ) {
    const tasks: WorldpayTask[] = []

    if (gatewayAccount.recurringEnabled) {
      tasks.push(WorldpayTask.recurringCustomerInitiatedCredentialsTask(serviceExternalId, gatewayAccount, credential))
      tasks.push(WorldpayTask.recurringMerchantInitiatedCredentialsTask(serviceExternalId, gatewayAccount, credential))
    } else {
      tasks.push(WorldpayTask.oneOffCustomerInitiatedCredentialsTask(serviceExternalId, gatewayAccount, credential))
    }

    if (!gatewayAccount.allowMoto) {
      tasks.push(WorldpayTask.flexCredentialsTask(serviceExternalId, gatewayAccount, credential))
    }

    if (gatewayAccount.providerSwitchEnabled && pendingCredentialStates.includes(credential.state)) {
      tasks.push(WorldpayTask.makeALivePaymentTask(serviceExternalId, gatewayAccount, credential))
    }

    return tasks
  }
}

class WorldpayTask extends Task {
  constructor(linkText: string, id: string, href: string) {
    super(linkText, id, href)
  }

  static flexCredentialsTask(
    serviceExternalId: string,
    gatewayAccount: GatewayAccount,
    credential: GatewayAccountCredential
  ) {
    const task = new WorldpayTask(
      'Configure 3DS',
      WORLDPAY_TASKS.FLEX,
      formatServiceAndAccountPathsFor(
        gatewayAccount.providerSwitchEnabled
          ? paths.simplifiedAccount.settings.switchPsp.switchToWorldpay.flexCredentials
          : paths.simplifiedAccount.settings.worldpayDetails.flexCredentials,
        serviceExternalId,
        gatewayAccount.type,
        credential.externalId
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
    credential: GatewayAccountCredential
  ) {
    const task = new WorldpayTask(
      'Recurring customer initiated transaction (CIT) credentials',
      WORLDPAY_TASKS.CIT,
      formatServiceAndAccountPathsFor(
        gatewayAccount.providerSwitchEnabled
          ? paths.simplifiedAccount.settings.switchPsp.switchToWorldpay.recurringCustomerInitiated
          : paths.simplifiedAccount.settings.worldpayDetails.recurringCustomerInitiated,
        serviceExternalId,
        gatewayAccount.type,
        credential.externalId
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
    credential: GatewayAccountCredential
  ) {
    const task = new WorldpayTask(
      'Recurring merchant initiated transaction (MIT) credentials',
      WORLDPAY_TASKS.MIT,
      formatServiceAndAccountPathsFor(
        gatewayAccount.providerSwitchEnabled
          ? paths.simplifiedAccount.settings.switchPsp.switchToWorldpay.recurringMerchantInitiated
          : paths.simplifiedAccount.settings.worldpayDetails.recurringMerchantInitiated,
        serviceExternalId,
        gatewayAccount.type,
        credential.externalId
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
    credential: GatewayAccountCredential
  ) {
    const task = new WorldpayTask(
      'Link your Worldpay account with GOV.UK Pay',
      WORLDPAY_TASKS.CRED,
      formatServiceAndAccountPathsFor(
        gatewayAccount.providerSwitchEnabled
          ? paths.simplifiedAccount.settings.switchPsp.switchToWorldpay.oneOffCustomerInitiated
          : paths.simplifiedAccount.settings.worldpayDetails.oneOffCustomerInitiated,
        serviceExternalId,
        gatewayAccount.type,
        credential.externalId
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

  static makeALivePaymentTask(
    serviceExternalId: string,
    gatewayAccount: GatewayAccount,
    credential: GatewayAccountCredential
  ) {
    const task = new WorldpayTask(
      'Make a live payment to test your Worldpay PSP',
      WORLDPAY_TASKS.PAYMENT,
      formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.switchPsp.makeTestPayment.outbound,
        serviceExternalId,
        gatewayAccount.type
      )
    )

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
