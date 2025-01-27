'use strict'

const formatSimplifiedAccountPathsFor = require('../utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const Connector = require('@services/clients/connector.client.js').ConnectorClient
const connectorClient = new Connector(process.env.CONNECTOR_URL)

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
      this.tasks.push(WorldpayTask.flexCredentialsTask(serviceExternalId, gatewayAccount.type))
    }

    this.incompleteTasks = this.tasks.filter(t => !(t.complete === true)).length > 0
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
    this.complete = false
  }

  setComplete (isComplete) {
    this.complete = isComplete
  }

  setCompletedCard (card) {
    this.completedCard = card
  }

  /**
   * @param {String} serviceExternalId
   * @param {String} accountType
   * @returns {WorldpayTask}
   */
  static flexCredentialsTask (serviceExternalId, accountType) {
    const task = new WorldpayTask(
      formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.worldpayDetails.flexCredentials,
        serviceExternalId, accountType),
      '3ds-flex-credentials',
      'Configure 3DS'
    )
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
      task.setComplete(false)
    } else {
      task.setComplete(true)
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
