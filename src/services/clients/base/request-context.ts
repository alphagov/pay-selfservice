import type { Request, Response, NextFunction } from 'express'
import crypto from 'crypto'
// @ts-expect-error js commons is not updated for typescript support yet
import { logging } from '@govuk-pay/pay-js-commons'
import { AsyncLocalStorage } from 'async_hooks'
import { CORRELATION_HEADER } from '@root/config'

const { CORRELATION_ID } = (logging as { keys: Record<string, string> }).keys

interface RequestContext {
  [key: string]: string | undefined

  [CORRELATION_ID]: string
}

const asyncLocalStorage = new AsyncLocalStorage<RequestContext>()

function requestContextMiddleware(req: Request, _: Response, next: NextFunction): void {
  asyncLocalStorage.run({} as RequestContext, () => {
    const store = asyncLocalStorage.getStore()
    if (store) {
      store[CORRELATION_ID] =
        (req.headers[CORRELATION_HEADER] as string | undefined) ?? crypto.randomBytes(16).toString('hex')
    }
    next()
  })
}

function addField(key: string, value: string) {
  const store = asyncLocalStorage.getStore()
  if (store) {
    store[key] = value
  }
}

function getRequestCorrelationIDField() {
  const store = asyncLocalStorage.getStore()
  if (store) {
    return store[CORRELATION_ID]
  }
  return undefined
}

function getLoggingFields() {
  return asyncLocalStorage.getStore()
}

export { requestContextMiddleware, addField, getRequestCorrelationIDField, getLoggingFields }
