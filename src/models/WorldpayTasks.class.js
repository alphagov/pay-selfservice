'use strict'

const formatSimplifiedAccountPathsFor = require('../utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const { ConnectorClient } = require('@services/clients/connector.client')
const TASK_STATUS = require('@models/constants/task-status')
const connectorClient = new ConnectorClient(process.env.CONNECTOR_URL)

class WorldpayTasks {
  /**
   * @param {GatewayAccount} gatewayAccount
   * @param {String} serviceExternalId
   */
  constructor (gatewayAccount, serviceExternalId) {
    this.tasks = []
    this.incompleteTasks = true

    const credential = gatewayAccount.getCurrentCredential()

    if (gatewayAccount.recurringEnabled) {
      this.tasks.push(WorldpayTask.recurringCustomerInitiatedCredentialsTask(serviceExternalId, gatewayAccount.type, credential))
      this.tasks.push(WorldpayTask.recurringMerchantInitiatedCredentialsTask(serviceExternalId, gatewayAccount.type, credential))
    } else {
      this.tasks.push(WorldpayTask.oneOffCustomerInitiatedCredentialsTask(serviceExternalId, gatewayAccount.type, credential))
    }

    if (!gatewayAccount.allowMoto) {
      this.tasks.push(WorldpayTask.flexCredentialsTask(serviceExternalId, gatewayAccount.type, gatewayAccount.worldpay3dsFlex))
    }

    this.incompleteTasks = this.tasks.filter(t => t.status !== TASK_STATUS.COMPLETED).length > 0
  }

  /**
   *
   * @param {String} taskId
   * @returns {WorldpayTask}
   */
  findTask (taskId) {
    return this.tasks.filter(t => t.id === taskId)[0]
  }

  static async recalculate (serviceExternalId, accountType) {
    const gatewayAccount = await connectorClient.getAccountByServiceExternalIdAndAccountType({ serviceExternalId, accountType })
    return new WorldpayTasks(gatewayAccount, serviceExternalId)
  }
}

class WorldpayTask {
  constructor (href, id, linkText) {
    this.href = href
    this.id = id
    this.linkText = linkText
    this.status = TASK_STATUS.NOT_STARTED
  }

  /**
   *
   * @param {TASK_STATUS} status
   */
  setStatus (status) {
    this.status = status
  }

  /**
   * @param {String} serviceExternalId
   * @param {String} accountType
   * @param {Worldpay3dsFlexCredential} worldpay3dsFlexCredential
   * @returns {WorldpayTask}
   */
  static flexCredentialsTask (serviceExternalId, accountType, worldpay3dsFlexCredential) {
    const task = new WorldpayTask(
      formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.worldpayDetails.flexCredentials,
        serviceExternalId, accountType),
      '3ds-flex-credentials',
      'Configure 3DS'
    )

    if (worldpay3dsFlexCredential) {
      task.setStatus(TASK_STATUS.COMPLETED)
    } else {
      task.setStatus(TASK_STATUS.NOT_STARTED)
    }

    return task
  }

  /**
   * @param {String} serviceExternalId
   * @param {String} accountType
   * @param {GatewayAccountCredential} credential
   * @returns {WorldpayTask}
   */
  static recurringCustomerInitiatedCredentialsTask (serviceExternalId, accountType, credential) {
    const task = new WorldpayTask(
      formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.worldpayDetails.recurringCustomerInitiated,
        serviceExternalId, accountType),
      null,
      'Recurring customer initiated transaction (CIT) credentials'
    )
    if (!credential || !credential.credentials.recurringCustomerInitiated) {
      task.setStatus(TASK_STATUS.NOT_STARTED)
    } else {
      task.setStatus(TASK_STATUS.COMPLETED)
    }

    return task
  }

  /**
   * @param {String} serviceExternalId
   * @param {String} accountType
   * @param {GatewayAccountCredential} credential
   * @returns {WorldpayTask}
   */
  static recurringMerchantInitiatedCredentialsTask (serviceExternalId, accountType, credential) {
    const task = new WorldpayTask(
      formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.worldpayDetails.recurringMerchantInitiated,
        serviceExternalId, accountType),
      null,
      'Recurring merchant initiated transaction (MIT) credentials'
    )
    if (!credential || !credential.credentials.recurringMerchantInitated) {
      task.setStatus(TASK_STATUS.NOT_STARTED)
    } else {
      task.setStatus(TASK_STATUS.COMPLETED)
    }

    return task
  }

  /**
   * @param {String} serviceExternalId
   * @param {String} accountType
   * @param {GatewayAccountCredential} credential
   * @returns {WorldpayTask}
   */
  static oneOffCustomerInitiatedCredentialsTask (serviceExternalId, accountType, credential) {
    const task = new WorldpayTask(
      formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.worldpayDetails.oneOffCustomerInitiated,
        serviceExternalId, accountType),
      'worldpay-credentials',
      'Link your Worldpay account with GOV.UK Pay'
    )
    if (!credential || !credential.credentials.oneOffCustomerInitiated) {
      task.setStatus(TASK_STATUS.NOT_STARTED)
    } else {
      task.setStatus(TASK_STATUS.COMPLETED)
    }

    return task
  }

  /**
   * @param {String} serviceExternalId
   * @param {String} accountType
   * @param {GatewayAccountCredential} credential
   * @returns {WorldpayTask}
   */
  static makeALivePaymentTask (serviceExternalId, accountType, credential) {
    const task = new WorldpayTask(
      formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.worldpayDetails.oneOffCustomerInitiated,
        serviceExternalId, accountType),
      'make-a-live-payment',
      'Make a live payment to test your Worldpay PSP'
    )
    task.setStatus(TASK_STATUS.CANNOT_START)
    return task
  }
}

module.exports = { WorldpayTasks, WorldpayTask }
