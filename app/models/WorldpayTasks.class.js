'use strict'

const formatSimplifiedAccountPathsFor = require('../utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')

class WorldpayTasks {
  /**
   * @param {GatewayAccount} gatewayAccount
   */
  constructor (gatewayAccount, service) {
    this.tasks = []
    this.incompleteTasks = true

    const credential = gatewayAccount.activeCredential

    if (gatewayAccount.allowMoto) {
      const worldpayCredentials = {
        href: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.worldpayDetails.credentials,
          service.externalId, gatewayAccount.type),
        id: 'worldpay-credentials',
        linkText: 'Link your Worldpay account with GOV.UK Pay',
        complete: true
      }
      if (credential === null || credential.credentials.one_off_customer_initiated === null) {
        worldpayCredentials.complete = false
      }
      this.tasks.push(worldpayCredentials)
    }

    this.incompleteTasks = this.tasks.filter(t => t.complete === false).length > 0
  }
}

module.exports = { WorldpayTasks }
