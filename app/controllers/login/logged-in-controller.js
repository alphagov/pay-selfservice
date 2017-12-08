'use strict'

// NPM dependencies
const logger = require('winston')
const _ = require('lodash')

// Custom dependencies
const response = require('../../utils/response').response
const CORRELATION_HEADER = require('../../utils/correlation_header').CORRELATION_HEADER

module.exports = (req, res) => {
  const correlationId = _.get(req, 'headers.' + CORRELATION_HEADER, '')
  logger.info(`[${correlationId}] successfully logged in`)
  response(req, res, 'dashboard/index', {
    name: req.user.username,
    serviceId: req.service.externalId
  })
}
