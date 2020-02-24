'use strict'

const logger = require('../utils/logger')(__filename)
const validAccountId = require('../utils/valid_account_id.js')
const { renderErrorView } = require('../utils/response.js')

const notAuthorised = (req, res) => {
  return renderErrorView(req, res, 'You do not have the rights to access this service.', 403)
}

module.exports = (req, res, next) => {
  let newAccountId = req.params.serviceId

  if (validAccountId(newAccountId, req.user)) {
    req.gateway_account.currentGatewayAccountId = newAccountId
    next()
  } else {
    logger.warn(`Attempted to switch to invalid account ${newAccountId}`)
    return notAuthorised(req, res)
  }
}
