'use strict'

class DomainError extends Error {
  constructor (message) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Thrown when there is no authentication session for the user.
 */
class NotAuthenticatedError extends DomainError {
}

/**
 * Thrown when the account is disabled for the logged in user.
 */
class UserAccountDisabledError extends DomainError {
}

/**
 * Thrown when the user does not have permission to access a resource.
 */
class NotAuthorisedError extends DomainError {
}

class PermissionDeniedError extends DomainError {
  constructor (permission) {
    super(`User does not have permission ${permission} for service`)
  }
}

/**
 * Thrown when the resource that a route is trying to access cannot be found.
 */
class NotFoundError extends DomainError {
}

module.exports = {
  NotAuthenticatedError,
  UserAccountDisabledError,
  NotAuthorisedError,
  PermissionDeniedError,
  NotFoundError
}
