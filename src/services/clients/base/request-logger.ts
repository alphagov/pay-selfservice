import createLogger from '@utils/logger/logger'
import LoggingContext from './config'
const logger = createLogger(__filename)

export = {
  logRequestStart: (context: LoggingContext) => {
    logger.info(`Calling ${context.service} to ${context.description}`, {
      service: context.service,
      method: context.method,
      url: context.url,
      description: context.description,
      ...context.additionalLoggingFields,
    })
  },

  logRequestEnd: (context: LoggingContext) => {
    const responseTime = (context.startTime && new Date().getTime() - context.startTime) || context.responseTime
    logger.info(`${context.method.toUpperCase()} to ${context.url} ended - elapsed time: ${responseTime} ms`, {
      service: context.service,
      method: context.method,
      url: context.url,
      description: context.description,
      response_time: responseTime,
      status: context.status,
      ...context.additionalLoggingFields,
    })
  },

  logRequestFailure: (context: LoggingContext) => {
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
      ...context.additionalLoggingFields,
    })
  },

  logRequestError: (context: LoggingContext, error: Error) => {
    logger.error(`Calling ${context.service} to ${context.description} threw exception`, {
      service: context.service,
      method: context.method,
      url: context.url,
      description: context.description,
      error,
      ...context.additionalLoggingFields,
    })
  },
}
