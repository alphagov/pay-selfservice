const { createLogger, format, transports } = require('winston')
const { json, splat, prettyPrint, combine, timestamp, printf, colorize } = format
const { govUkPayLoggingFormat } = require('@govuk-pay/pay-js-commons').logging
const { addSentryToErrorLevel } = require('./sentry.js')
const { getLoggingFields } = require('../services/clients/base/request-context')

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

const nsDebugFormat = printf(({ level, message, timestamp, ...metadata }) => {
  const metadataStr = Object.keys(metadata).length
    ? JSON.stringify(metadata, null, 2)
    : ''

  return metadataStr
    ? `${timestamp} [${level}]: ${message}\n${metadataStr}`
    : `${timestamp} [${level}]: ${message}`
})

const nsDebugLogger = createLogger({
  format: combine(
    colorize({
      colors: {
        error: 'red',
        warn: 'yellow',
        info: 'green',
        debug: 'blue'
      }
    }),
    timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    nsDebugFormat
  ),
  transports: [
    new transports.Console({
      level: 'debug'
    })
  ]
})

const nsDebug = process.env.NS_DEBUG === 'true'

module.exports = (loggerName) => {
  if (process.env.GOVUK_PAY__USE_BASIC_LOGGER === 'true') {
    return console
  }
  const childLogger = nsDebug
    ? nsDebugLogger.child({ logger_name: loggerName })
    : logger.child({ logger_name: loggerName })
  return addSentryToErrorLevel(childLogger)
}
