'use strict'

// NPM Dependencies
const correlator = require('correlation-id')

// Local Dependencies
const CORRELATION_HEADER = require('../utils/correlation_header').CORRELATION_HEADER

module.exports = correlationMiddleware

function correlationMiddleware (req, res, next) {
  const id = req.headers[CORRELATION_HEADER]
  req.correlationId = id
  correlator.withId(id, next)
}
