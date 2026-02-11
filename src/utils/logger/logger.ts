import { createLogger, format, Logform, transports } from 'winston'
// @ts-expect-error js commons is not updated for typescript support yet
import { logging } from '@govuk-pay/pay-js-commons'
import { addSentryToErrorLevel } from '@utils/sentry.js'
import { getLoggingFields } from '@services/clients/base/request-context'
import { debugLoggingFormat, localLogger, simpleLoggingFormat } from '@utils/logger/local-logger'

const { json, splat, prettyPrint } = format

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

export = (loggerName: string) => {
  if (process.env.NODE_ENV !== 'production') {
    // only allow custom loggers outside of production environment
    if (process.env.GOV_UK_PAY__LOGGING_FORMAT === 'debug') {
      return localLogger(debugLoggingFormat)
    }

    if (process.env.GOVUK_PAY__USE_BASIC_LOGGER === 'true') {
      return localLogger(simpleLoggingFormat)
    }

    if (process.env.GOVUK_PAY__USE_BASIC_LOGGER === 'console') {
      return console // sometimes you just want console because it shows stack traces.
    }
  }

  return addSentryToErrorLevel(logger.child({ logger_name: loggerName }))
}
