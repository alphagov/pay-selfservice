import { PermissionDeniedError } from '../errors'
import {RequestHandler} from "express";
import type User from '@models/user/User.class'
import type Service from '@models/service/Service.class'
/**
 * @param {String} permission User must be associated to a role with the given permission
 * to have authorization for the operation.
 *
 * For the moment if undefined, the check is skipped.
 */

interface PermissionsRequest extends Request {
  user?: User
  service?: Service
}

function permissionMiddleware (permission: string): RequestHandler {
  return function userHasPermission (req: PermissionsRequest, res, next) {
    if (!req.user || !req.service) {
      return next(new Error('Request data is missing'))
    }
    if (permission && !req.user.hasPermission(req.service.externalId, permission)) {
      return next(new PermissionDeniedError(permission))
    }

    return next()
  }
}

export = permissionMiddleware
