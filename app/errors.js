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
 * Thrown when the user does not have permission to access a resource.
 */
class NotAuthorisedError extends DomainError {
}

/**
 * Thrown when the resource that a route is trying to access cannot be found.
 */
class NotFoundError extends DomainError {
}

module.exports = {
  NotAuthenticatedError,
  NotAuthorisedError,
  NotFoundError
}
