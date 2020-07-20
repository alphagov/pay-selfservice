const logger = require('./logger')(__filename)
const { keys } = require('@govuk-pay/pay-js-commons').logging

module.exports = {
  logRequestStart: context => {
    const logContext = {
      service: context.service,
      method: context.method,
      url: context.url,
      description: context.description
    }
    logContext[keys.CORRELATION_ID] = context.correlationId
    logger.info(`Calling ${context.service} to ${context.description}`, logContext)
  },

  logRequestEnd: (context, response) => {
    let duration = new Date() - context.startTime
    const logContext = {
      service: context.service,
      method: context.method,
      url: context.url,
      description: context.description,
      response_time: duration,
      status: response && response.statusCode
    }
    logContext[keys.CORRELATION_ID] = context.correlationId
    logger.info(`${context.method} to ${context.url} ended - elapsed time: ${duration} ms`, logContext)
  },

  logRequestFailure: (context, response) => {
    const logContext = {
      service: context.service,
      method: context.method,
      url: context.url,
      description: context.description,
      status: response.statusCode
    }
    logContext[keys.CORRELATION_ID] = context.correlationId
    logger.info(`Calling ${context.service} to ${context.description} failed`, logContext)
  },

  logRequestError: (context, error) => {
    const logContext = {
      service: context.service,
      method: context.method,
      url: context.url,
      description: context.description,
      error: error
    }
    logContext[keys.CORRELATION_ID] = context.correlationId
    logger.error(`Calling ${context.service} to ${context.description} threw exception`, logContext)
  }
}
