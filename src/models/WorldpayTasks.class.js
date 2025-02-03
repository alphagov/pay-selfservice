'use strict'

const formatSimplifiedAccountPathsFor = require('../utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const { ConnectorClient } = require('@services/clients/connector.client')
const connectorClient = new ConnectorClient(process.env.CONNECTOR_URL)

/**
 *
 * @readonly
 * @enum {String}
 */
const TASK_STATUS = {
  NOT_STARTED: 'NOT_STARTED',
  COMPLETED: 'COMPLETED',
  CANNOT_START: 'CANNOT_START'
}

class WorldpayTasks {
  /**
   * @param {GatewayAccount} gatewayAccount
   * @param {String} serviceExternalId
   */
  constructor (gatewayAccount, serviceExternalId) {
    this.tasks = []
    this.incompleteTasks = true

    const credential = gatewayAccount.getCurrentCredential()

    this.tasks.push(WorldpayTask.oneOffCustomerInitiatedCredentialsTask(serviceExternalId, gatewayAccount.type, credential))

    if (!gatewayAccount.allowMoto) {
      this.tasks.push(WorldpayTask.flexCredentialsTask(serviceExternalId, gatewayAccount.type, gatewayAccount.worldpay3dsFlex, this.tasks.filter(t => t.id === 'worldpay-credentials')[0]?.status === TASK_STATUS.COMPLETED))
    }

    this.incompleteTasks = this.tasks.filter(t => t.complete !== true).length > 0
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

  setCompletedCard (card) {
    this.completedCard = card
  }

  /**
   * @param {String} serviceExternalId
   * @param {String} accountType
   * @param {Worldpay3dsFlexCredential} worldpay3dsFlexCredential
   * @param {Boolean} ableToStart
   * @returns {WorldpayTask}
   */
  static flexCredentialsTask (serviceExternalId, accountType, worldpay3dsFlexCredential, ableToStart) {
    const task = new WorldpayTask(
      formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.worldpayDetails.flexCredentials,
        serviceExternalId, accountType),
      '3ds-flex-credentials',
      'Configure 3DS'
    )

    if (worldpay3dsFlexCredential) {
      task.setStatus(TASK_STATUS.COMPLETED)
      task.setCompletedCard({
        title: '3DS Flex Credentials',
        rows: [{
          keyText: 'Organisational Unit ID',
          valueText: worldpay3dsFlexCredential.organisationalUnitId
        }, {
          keyText: 'Issuer (API ID)',
          valueText: worldpay3dsFlexCredential.issuer
        }, {
          keyText: 'JWT MAC Key',
          valueText: '●●●●●●●●'
        }]
      })
    } else if (ableToStart) {
      task.setStatus(TASK_STATUS.NOT_STARTED)
    } else {
      task.setStatus(TASK_STATUS.CANNOT_START)
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
      task.setCompletedCard({
        title: 'Account credentials',
        rows: [{
          keyText: 'Merchant code',
          valueText: credential.credentials?.oneOffCustomerInitiated?.merchantCode
        }, {
          keyText: 'Username',
          valueText: credential.credentials?.oneOffCustomerInitiated?.username
        }, {
          keyText: 'Password',
          valueText: '●●●●●●●●'
        }]
      })
    }

    return task
  }
}

module.exports = { WorldpayTasks }
