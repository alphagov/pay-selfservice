import { PermissionDeniedError } from '../errors'
import { RequestHandler } from 'express'
import { Request } from 'express'
/**
 * @param {String} permission User must be associated to a role with the given permission
 * to have authorization for the operation.
 *
 * For the moment if undefined, the check is skipped.
 */

function permissionMiddleware(permission: string): RequestHandler {
  return function userHasPermission(req: Request, res, next) {
    if (!req.user || !req.service) {
      return next(new Error('Request data is missing'))
    }
    try {
      if (permission && !req.user.hasPermission(req.service.externalId, permission)) {
        return next(new PermissionDeniedError(permission))
      }

      return next()
    } catch (e) {
      console.log(e)
    }
  }
}

export = permissionMiddleware
