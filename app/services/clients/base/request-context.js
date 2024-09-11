'use strict'

const { CORRELATION_ID } = require('@govuk-pay/pay-js-commons').logging.keys

const { AsyncLocalStorage } = require('async_hooks')
const { CORRELATION_HEADER } =  require('../../../../config')
const crypto = require('crypto')

const asyncLocalStorage = new AsyncLocalStorage()

function requestContextMiddleware (req, res, next) {
  asyncLocalStorage.run({}, () => {
    asyncLocalStorage.getStore()[CORRELATION_ID] = req.headers[CORRELATION_HEADER] || crypto.randomBytes(16).toString('hex')
    next()
  })
}

function addField (key, value) {
  if (asyncLocalStorage.getStore()) {
    asyncLocalStorage.getStore()[key] = value
  }
}

function getRequestCorrelationIDField () {
  if (asyncLocalStorage.getStore()) {
    return asyncLocalStorage.getStore()[CORRELATION_ID]
  }
}

function getLoggingFields () {
  return asyncLocalStorage.getStore()
}

module.exports = {
  requestContextMiddleware,
  addField,
  getRequestCorrelationIDField,
  getLoggingFields
}
