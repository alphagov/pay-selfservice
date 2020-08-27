'use strict'

const logger = require('../utils/logger')(__filename)
const { renderErrorView } = require('../utils/response')

module.exports = function (req, res, next) {
  const correlationId = req.correlationId
  if (!req.register_invite) {
    logger.warn(`[requestId=${correlationId}] unable to validate required cookie for registration`)
    renderErrorView(req, res, 'Unable to process registration at this time', 404)
  }
  next()
}
