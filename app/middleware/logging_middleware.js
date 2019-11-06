const morgan = require('morgan')
const { requestLogFormat } = require('@govuk-pay/pay-js-commons').logging
const logger = require('../../app/utils/logger')(__filename)

module.exports = function () {
  return morgan(requestLogFormat, {
    stream: {
      write: message => {
        logger.info('Request received', JSON.parse(message))
      }
    }
  })
}
