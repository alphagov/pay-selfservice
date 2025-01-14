const Sentry = require('@sentry/node')

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

const addSentryToErrorLevel = originalLogger => {
  const sentryLogger = Object.create(originalLogger)
  sentryLogger.error = function () {
    try {
      Sentry.captureException(new Error(JSON.stringify(arguments)))
    } finally {
      originalLogger.error(...arguments)
    }
  }
  return sentryLogger
}

module.exports = {
  initialiseSentry,
  addSentryToErrorLevel
}
