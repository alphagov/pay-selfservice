const logger = require('./logger')(__filename)

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

  logRequestEnd: (context, response) => {
    const duration = new Date() - context.startTime
    logger.info(`${context.method} to ${context.url} ended - elapsed time: ${duration} ms`, {
      service: context.service,
      method: context.method,
      url: context.url,
      description: context.description,
      response_time: duration,
      status: response && response.statusCode,
      ...context.additionalLoggingFields
    })
  },

  logRequestFailure: (context, response) => {
    logger.info(`Calling ${context.service} to ${context.description} failed`, {
      service: context.service,
      method: context.method,
      url: context.url,
      description: context.description,
      status: response.statusCode,
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
