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
 * Thrown when the user does not have access to a resource.
 */
class NotAuthorisedError extends DomainError {
}

/**
 * Thrown when the user does not have the permission for the given service to access a resource.
 */
class PermissionDeniedError extends DomainError {
  constructor (permission) {
    super(`User does not have permission ${permission} for service`)
  }
}

/**
 * Thrown when access is denied because the user does not have access to any services with the
 * required permission.
 */
class NoServicesWithPermissionError extends DomainError {
}

/**
 * Thrown when the resource that a route is trying to access cannot be found.
 */
class NotFoundError extends DomainError {
}

/**
 * Thrown when data that is expected in the user's session cookie for registration is missing
 * and it is not possible for us to recover from this, and so want to show an error page.
 */
class RegistrationSessionMissingError extends DomainError {
}

module.exports = {
  NotAuthenticatedError,
  UserAccountDisabledError,
  NotAuthorisedError,
  PermissionDeniedError,
  NoServicesWithPermissionError,
  NotFoundError,
  RegistrationSessionMissingError
}
