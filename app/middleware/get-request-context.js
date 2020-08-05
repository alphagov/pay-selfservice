'use strict'

const lodash = require('lodash')

const localstore = {}

exports.getRequestContext = correlationId => {
  return localstore[correlationId]
}

exports.middleware = (req, res, next) => {
  const correlationID = req.correlationId

  if (correlationID) {
    localstore[correlationID] = {
      features: lodash.get(req, 'user.features')
    }

    res.on('finish', function () {
      localstore[correlationID] = undefined
    })
  }

  next()
}
