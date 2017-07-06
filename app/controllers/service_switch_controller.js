const q = require('q')
const _ = require('lodash')
const logger = require('winston')

const paths = require('../paths')
const responses = require('../utils/response')
const ConnectorClient = require('../services/clients/connector_client').ConnectorClient

var successResponse = responses.response
var errorResponse = responses.renderErrorView

var connectorClient = () => new ConnectorClient(process.env.CONNECTOR_URL)

const validAccountId = (accountId, user) => accountId && user.gatewayAccountIds.indexOf(accountId) !== -1

module.exports = {
  /**
   *
   * @param req
   * @param res
   */
  index: (req, res) => {
    const gatewayAccountIds = _.get(req, 'user.gatewayAccountIds', null)
    const services = _.get(req, 'user.services', null)

    if (!gatewayAccountIds || !gatewayAccountIds.length) {
      logger.info(`[${req.correlationId}] No gateway accounts found for user`)
      return errorResponse(req, res, 'No gateway accounts found for user')
    }

    if (!services || !services.length) {
      logger.info(`[${req.correlationId}] No services found for user`)
      return errorResponse(req, res, 'No services found for user')
    }

    // TODO: currently we only support one service per user, we will support multiple in future
    const serviceName = services[0].name === 'System Generated' ? '' : services[0].name

    return q.allSettled(gatewayAccountIds
      .map(gatewayAccountId => connectorClient().getAccount({
        gatewayAccountId: gatewayAccountId,
        correlationId: req.correlationId
      })))
      .then(gatewayAccountPromises => gatewayAccountPromises
        .filter(promise => promise.state === 'fulfilled')
        .map(promise => promise.value))
      .then(gatewayAccounts => {
        successResponse(req, res, 'services/index', {
          navigation: false,
          gatewayAccounts,
          serviceName
        })
      })
      .catch(() => errorResponse(req, res, 'Unable to display accounts'))
  },

  /**
   *
   * @param req
   * @param res
   */
  switch: (req, res) => {
    let newAccountId = _.get(req, 'body.gatewayAccountId')

    if (validAccountId(newAccountId, req.user)) {
      req.gateway_account.currentGatewayAccountId = newAccountId
      res.redirect(302, '/')
    } else {
      logger.warn(`Attempted to switch to invalid account ${newAccountId}`)
      res.redirect(302, paths.serviceSwitcher.index)
    }
  }
}
