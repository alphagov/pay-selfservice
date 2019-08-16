'use strict'
const { createLogger, format } = require('winston')
const { timestamp, json } = format
const logger = createLogger({
  format: format.combine(
    timestamp(),
    json()
  )
})

const { CORRELATION_HEADER } = require('../../config')

module.exports = (function () {
  'use strict'

  var withCorrelationHeader = function (args, correlationId) {
    correlationId = correlationId || ''

    if (correlationId === '') {
      logger.warn('Missing correlation ID header [X-Request-Id] in request.')
    }

    args = args || {}
    args.headers = args.headers || {}
    args.headers[CORRELATION_HEADER] = correlationId
    return args
  }

  return {
    CORRELATION_HEADER: CORRELATION_HEADER,
    withCorrelationHeader: withCorrelationHeader
  }
}())
