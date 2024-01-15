'use strict'

const { NotAuthorisedError, NotAuthenticatedError, UserAccountDisabledError } = require('../errors')
const { SERVICE_EXTERNAL_ID, GATEWAY_ACCOUNT_EXTERNAL_ID } = require('../paths').keys

module.exports = function userIsAuthorised (req, res, next) {
  const { user, session, params, service } = req

  if (!user) {
    return next(new NotAuthenticatedError('User not found on request'))
  }
  if (!session) {
    return next(new NotAuthenticatedError('Session not found on request'))
  }
  if (user.sessionVersion !== session.version) {
    return next(new NotAuthenticatedError(`Invalid session version - session version is ${session.version}, user session version is ${user.sessionVersion}`))
  }
  if (!(session.secondFactor && session.secondFactor === 'totp')) {
    return next(new NotAuthenticatedError('Not completed second factor authentication'))
  }
  if (user.disabled) {
    return next(new UserAccountDisabledError('User account is disabled'))
  }

  if (user.role && user.role.name != null) {
    next()
  } else {
    if (params[GATEWAY_ACCOUNT_EXTERNAL_ID] || params[SERVICE_EXTERNAL_ID]) {
      if (!service) {
        return next(new NotAuthorisedError('Service not found on request'))
      }
      if (!user.serviceRoles.find(serviceRole => serviceRole.service.externalId === service.externalId)) {
        return next(new NotAuthorisedError('User does not have service role for service'))
      }
    }
    next()
  }
}
