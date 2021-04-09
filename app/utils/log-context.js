'use strict'

const { CORRELATION_ID } = require('@govuk-pay/pay-js-commons').logging.keys

const { AsyncLocalStorage } = require('async_hooks')
const { CORRELATION_HEADER } = require('../../config')

const asyncLocalStorage = new AsyncLocalStorage()

function logContextMiddleware (req, res, next) {
  asyncLocalStorage.run({}, () => {
    asyncLocalStorage.getStore()[CORRELATION_ID] = req.headers[CORRELATION_HEADER]
    next()
  })
}

function addLoggingField (key, value) {
  if (asyncLocalStorage.getStore()) {
    asyncLocalStorage.getStore()[key] = value
  }
}

function getLoggingFields () {
  return asyncLocalStorage.getStore()
}

module.exports = {
  logContextMiddleware,
  addLoggingField,
  getLoggingFields
}
