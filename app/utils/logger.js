const { createLogger, format, transports } = require('winston')
const { json, splat, prettyPrint } = format
const { govUkPayLoggingFormat } = require('@govuk-pay/pay-js-commons').logging
const { addSentryToErrorLevel } = require('./sentry.js')
const { getLoggingFields } = require('./log-context')

const supplementSharedLoggingFields = format((info) => {
  if (getLoggingFields()) {
    return Object.assign(info, getLoggingFields())
  }
  return info
})

const logger = createLogger({
  format: format.combine(
    supplementSharedLoggingFields(),
    splat(),
    prettyPrint(),
    govUkPayLoggingFormat({ container: 'selfservice', environment: process.env.ENVIRONMENT }),
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
