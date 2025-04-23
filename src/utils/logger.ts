import { createLogger, format, Logform, transports } from 'winston'
// @ts-expect-error js commons is not updated for typescript support yet
import { logging } from '@govuk-pay/pay-js-commons'
import { addSentryToErrorLevel } from '@utils/sentry.js'
import { getLoggingFields } from '@services/clients/base/request-context'

const { json, splat, prettyPrint, combine, timestamp, printf, colorize } = format

interface PayJsCommonsLogging {
  govUkPayLoggingFormat: (options: { container: string; environment?: string }) => Logform.Format
}

const { govUkPayLoggingFormat } = logging as PayJsCommonsLogging

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
  transports: [new transports.Console()],
})

const simpleLoggingFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp as string} [${level}]: ${message as string}`
})

const simpleLogger = createLogger({
  format: combine(
    colorize({
      colors: {
        error: 'red',
        warn: 'yellow',
        info: 'green',
        debug: 'blue',
      },
    }),
    timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    simpleLoggingFormat
  ),
  transports: [
    new transports.Console({
      level: 'debug',
    }),
  ],
})

export = (loggerName: string) => {
  if (process.env.GOVUK_PAY__USE_BASIC_LOGGER === 'true') {
    return simpleLogger
  }
  if (process.env.GOVUK_PAY__USE_BASIC_LOGGER === 'console') {
    return console // sometimes you just want console because it shows stack traces.
  }
  return addSentryToErrorLevel(logger.child({ logger_name: loggerName }))
}
