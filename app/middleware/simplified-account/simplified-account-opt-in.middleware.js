const { InvalidConfigurationError, NotAuthenticatedError } = require('../../errors')

module.exports = (req, res, next) => {
  if (req.user) {
    const user = req.user
    if (user.isDegatewayed()) {
      next()
    } else {
      next(new InvalidConfigurationError(`User with id ${user.externalId} not opted in to account simplification or feature is disabled in this environment.`))
    }
  } else {
    next(new NotAuthenticatedError('Invalid/missing session'))
  }
}
