const morgan = require('morgan')
const logger = require('../utils/logger')(__filename)
const { CORRELATION_HEADER } = require('../../config')
const { format } = require('@govuk-pay/pay-js-commons').logging.requestLogFormat(CORRELATION_HEADER)

module.exports = function () {
  return morgan(format, {
    stream: {
      write: message => {
        logger.info('Request received', JSON.parse(message))
      }
    }
  })
}
