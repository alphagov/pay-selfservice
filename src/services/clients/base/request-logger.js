const logger = require('../../../utils/logger')(__filename)

module.exports = {
  logRequestStart: context => {
    logger.info(`Calling ${context.service} to ${context.description}`, {
      service: context.service,
      method: context.method,
      url: context.url,
      description: context.description,
      ...context.additionalLoggingFields
    })
  },

  logRequestEnd: (context) => {
    const responseTime = (context.startTime && new Date() - context.startTime) || context.responseTime
    logger.info(`${context.method} to ${context.url} ended - elapsed time: ${responseTime} ms`, {
      service: context.service,
      method: context.method,
      url: context.url,
      description: context.description,
      response_time: responseTime,
      status: context.status,
      ...context.additionalLoggingFields
    })
  },

  logRequestFailure: (context) => {
    let message = `Calling ${context.service} to ${context.description} failed`
    if (context.retry) {
      message = message + ' - request will be retried'
    }

    logger.info(message, {
      service: context.service,
      method: context.method,
      url: context.url,
      description: context.description,
      status: context.status,
      ...context.additionalLoggingFields
    })
  },

  logRequestError: (context, error) => {
    logger.error(`Calling ${context.service} to ${context.description} threw exception`, {
      service: context.service,
      method: context.method,
      url: context.url,
      description: context.description,
      error,
      ...context.additionalLoggingFields
    })
  }
}
