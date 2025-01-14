'use strict'

const { PermissionDeniedError } = require('../errors')

/**
 * @param {String} permission User must be associated to a role with the given permission
 * to have authorization for the operation.
 *
 * For the moment if undefined, the check is skipped.
 */
module.exports = function getUserHasPermissionMiddleware (permission) {
  return function userHasPermission (req, res, next) {
    if (!req.user || !req.service) {
      return next(new Error('Request data is missing'))
    }
    if (permission && !req.user.hasPermission(req.service.externalId, permission)) {
      return next(new PermissionDeniedError(permission))
    }

    return next()
  }
}
