import requestLogger from './request-logger'
import { getRequestCorrelationIDField } from '@services/clients/base/request-context'
import { CORRELATION_HEADER } from '@root/config'
import IClient from '@services/clients/base/Client.class'

export default interface LoggingContext {
  service: string
  description: string
  method: string
  url: string
  status: string
  startTime: number
  responseTime?: number
  retry?: boolean
  additionalLoggingFields: Record<string, string>
}

function transformRequestAddHeaders() {
  const correlationId = getRequestCorrelationIDField()
  const headers: Record<string, string> = {}
  if (correlationId) {
    headers[CORRELATION_HEADER] = correlationId
  }
  return headers
}

function onRequestStart(context: LoggingContext) {
  requestLogger.logRequestStart(context)
}

function onSuccessResponse(context: LoggingContext) {
  requestLogger.logRequestEnd(context)
}

function onFailureResponse(context: LoggingContext) {
  requestLogger.logRequestEnd(context)
  requestLogger.logRequestFailure(context)
}

function configureClient(client: IClient, baseUrl: string) {
  client.configure(encodeURI(baseUrl), {
    transformRequestAddHeaders,
    onRequestStart,
    onSuccessResponse,
    onFailureResponse,
  })
}

export { configureClient }
