'use strict'

const { getActiveCredential } = require('@utils/credentials')

class WorldpayTasks {
  /**
   * @param {GatewayAccount} gatewayAccount
   */
  constructor (gatewayAccount) {
    this.tasks = []
    this.incompleteTasks = true

    const credential = getActiveCredential(gatewayAccount.rawResponse)

    if (gatewayAccount.allowMoto) {
      const worldpayCredentials = {
        href: '#',
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
