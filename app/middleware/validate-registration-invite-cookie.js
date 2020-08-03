'use strict'

const logger = require('../utils/logger')(__filename)
const { renderErrorView } = require('../utils/response')
const { shouldProceedWithRegistration } = require('../utils/registration-validations')

module.exports = function (req, res, next) {
  const correlationId = req.correlationId
  return shouldProceedWithRegistration(req.register_invite)
    .then(next)
    .catch(err => {
      logger.warn(`[requestId=${correlationId}] unable to validate required cookie for registration - ${err.message}`)
      renderErrorView(req, res, 'Unable to process registration at this time', 404)
    })
}
