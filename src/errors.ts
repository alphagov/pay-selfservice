class DomainError extends Error {
  constructor (message: string) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

class GatewayTimeoutError extends Error {
  constructor (message: string) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

class GatewayTimeoutForAllServicesSearchError extends Error {
  constructor (message: string) {
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
  constructor (permission: string) {
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

/**
 * Thrown when a user is trying to do something in the registration flow but has not yet
 * completed the prerequisite steps.
 */
class InvalidRegistrationStateError extends DomainError {
}

/**
 * Thrown when account isn't correctly configured to access the resource
 */
class InvalidConfigurationError extends DomainError {
}

/**
 * Thrown when trying to visit a registration page for an invite which has expired
 */
class ExpiredInviteError extends DomainError {
}

/**
 * Thrown when trying to visit a task page when the task has already been completed
 */
class TaskAlreadyCompletedError extends DomainError {
}

/**
 * Thrown when trying to visit a task page when the requisite tasks have not been completed
 */
class TaskAccessedOutOfSequenceError extends DomainError {
  public redirect: string
  constructor (message: string, redirectPath: string) {
    super(message)
    this.redirect = redirectPath
  }
}

export {
  NotAuthenticatedError,
  UserAccountDisabledError,
  NotAuthorisedError,
  PermissionDeniedError,
  NoServicesWithPermissionError,
  NotFoundError,
  RegistrationSessionMissingError,
  InvalidRegistrationStateError,
  InvalidConfigurationError,
  ExpiredInviteError,
  GatewayTimeoutError,
  GatewayTimeoutForAllServicesSearchError,
  TaskAlreadyCompletedError,
  TaskAccessedOutOfSequenceError
}
