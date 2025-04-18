import * as Sentry from '@sentry/node'
import { Logger } from 'winston'

function initialiseSentry () {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.ENVIRONMENT,
    beforeSend (event) {
      if (event.request) {
        delete event.request // This can include sensitive data such as card numbers
      }
      return event
    }
  })
  return Sentry
}

const addSentryToErrorLevel = (originalLogger: Logger): Logger => {
  const sentryLogger = Object.create(originalLogger) as Logger
  sentryLogger.error = function(...args: unknown[]): Logger {
    try {
      Sentry.captureException(new Error(JSON.stringify(args)))
    } finally {
      originalLogger.error(args);
    }
    return this
  }
  return sentryLogger
}

export {
  initialiseSentry,
  addSentryToErrorLevel
}
