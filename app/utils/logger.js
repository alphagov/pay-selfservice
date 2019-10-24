const { createLogger, format, transports } = require('winston')
const { json, splat, prettyPrint } = format
const { govUkPayLoggingFormat } = require('@govuk-pay/pay-js-commons').logging
const { addSentryToErrorLevel } = require('./sentry.js')

const logger = createLogger({
  format: format.combine(
    splat(),
    prettyPrint(),
    govUkPayLoggingFormat({ container: 'selfservice' }),
    json()
  ),
  transports: [
    new transports.Console()
  ]
})

module.exports = (loggerName) => {
  const childLogger = logger.child({ logger_name: loggerName })
  return addSentryToErrorLevel(childLogger)
}
