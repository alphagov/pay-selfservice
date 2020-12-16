'use strict'

const resolveService = require('./resolve-service')
const { PermissionDeniedError } = require('../errors')

/**
 * @param {String} permission User must be associated to a role with the given permission
 * to have authorization for the operation.
 *
 * For the moment if undefined, the check is skipped.
 */
module.exports = function getUserHasPermissionMiddleware (permission) {
  // TODO: currently this also returns the resolveService middleware to ensure it is run on the
  // route first. This won't be necessary when we have switched over to using our new middleware
  // stack in https://payments-platform.atlassian.net/browse/PP-7520
  return [resolveService, function userHasPermission (req, res, next) {
    if (!req.user || !req.service) {
      return next(new Error('Request data is missing'))
    }
    if (permission && !req.user.hasPermission(req.service.externalId, permission)) {
      return next(new PermissionDeniedError(permission))
    }

    return next()
  }]
}
