'use strict'

const formatSimplifiedAccountPathsFor = require('../utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')

class WorldpayTasks {
  /**
   * @param {GatewayAccount} gatewayAccount
   * @param {Service} service
   */
  constructor (gatewayAccount, service) {
    this.tasks = []
    this.incompleteTasks = true

    const credential = gatewayAccount.getCurrentCredential()

    if (gatewayAccount.allowMoto) {
      const worldpayCredentials = {
        href: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.worldpayDetails.oneOffCustomerInitiated,
          service.externalId, gatewayAccount.type),
        id: 'worldpay-credentials',
        linkText: 'Link your Worldpay account with GOV.UK Pay',
        complete: true,
        completedCard: {
          title: 'Account credentials',
          rows: [{
            keyText: 'Merchant Code',
            valueText: credential.credentials?.oneOffCustomerInitiated?.merchantCode
          }, {
            keyText: 'Username',
            valueText: credential.credentials?.oneOffCustomerInitiated?.username
          }, {
            keyText: 'Password',
            valueText: '●●●●●●●●'
          }]
        }
      }
      if (!credential || !credential.credentials.oneOffCustomerInitiated) {
        worldpayCredentials.complete = false
      }
      this.tasks.push(worldpayCredentials)
    }

    this.incompleteTasks = this.tasks.filter(t => t.complete === false).length > 0
  }
}

module.exports = { WorldpayTasks }
