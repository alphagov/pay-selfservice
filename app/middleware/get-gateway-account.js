'use strict'

const _ = require('lodash')
const logger = require('../utils/logger')(__filename)
const auth = require('../services/auth.service.js')
const Connector = require('../services/clients/connector.client.js').ConnectorClient
const connectorClient = new Connector(process.env.CONNECTOR_URL)
const directDebitConnectorClient = require('../services/clients/direct-debit-connector.client.js')

module.exports = function (req, res, next) {
  // @TMP(sfount) based on very nice guidance, stop passing req and res around, fin
  // - plus add this to guidance
  const accountId = auth.getCurrentGatewayAccountId(req)
  const params = {
    gatewayAccountId: accountId,
    correlationId: req.correlationId
  }
  // account - enforced in either java commons (admin users)
  // @TMP(sfount) - potentially we can remove some of the "glue" parts of direct debit that
  // - can be implemented with up to date standards
  // {
  // id: '12345'
  // type: 'card', 'direct_debit'
  // }
  // @TMP(sfount) - do we need to support direct debit accounts forever in self service?
  // @TMP(sfount) - do we look at typescript?
  // - what's needed?
  // - personally for sfount: if the toolbox branch can be pushed and agreed on a good experience; it would give confidence for porting to self service
  if (directDebitConnectorClient.isADirectDebitAccount(accountId)) {
    return directDebitConnectorClient.gatewayAccount.get(params)
      .then(gatewayAccount => {
        req.account = gatewayAccount
        next()
      })

      // @TMP(sfount) - what would the upstream code do - how would it respond? everythign assumes you've got an account
      // - this should explicitly blow up
      .catch(err => {
        logger.error(`${req.correlationId} - Error when attempting to retrieve direct debit gateway account: ${err}`)
        next()
      })
  }

  return connectorClient.getAccount(params)
    .then(data => {
      // @TMP(sfount) "magic" values are added here - how does a developer know why or where this is added
      // - should this be a model so that everything in self service is talking the same language
      // - potentially leaning more on models would be a middle ground for TypeScript
      // - we have a combination of direct data and models in the same resources
      req.account = _.extend({}, data, {
        // TMP(sfount) why is it here that knows this
        supports3ds: ['worldpay', 'stripe', 'epdq', 'smartpay'].includes(_.get(data, 'payment_provider')),
        disableToggle3ds: _.get(data, 'payment_provider') === 'stripe'
      })
      if (req.account.payment_provider === 'stripe') {
        return connectorClient.getStripeAccountSetup(accountId, req.correlationId)
      }
    })
    .then((connectorGatewayAccountStripeProgress = null) => {
      if (connectorGatewayAccountStripeProgress) {
        req.account.connectorGatewayAccountStripeProgress = connectorGatewayAccountStripeProgress
      }
      next()
    })
    // @TMP(sfount) why do we carry on
    .catch(err => {
      logger.error(`${req.correlationId} - Error when attempting to retrieve card gateway account: ${err}`)
      next()
    })
}
