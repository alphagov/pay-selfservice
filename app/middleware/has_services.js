'use strict'

// NPM dependencies
const logger = require('winston')
const _ = require('lodash')

// Local dependencies
const paths = require('../paths')

module.exports = (req, res, next) => {
  const serviceRoles = _.get(req, 'user.serviceRoles', [])
  if (req.url !== paths.serviceSwitcher.index && serviceRoles.length === 0) {
    if (!req.user.isPlatformAdmin) {
      logger.info('User does not belong to any service user_external_id=', _.get(req, 'user.externalId'))
    }
    res.redirect(paths.serviceSwitcher.index)
  } else {
    next()
  }
}
