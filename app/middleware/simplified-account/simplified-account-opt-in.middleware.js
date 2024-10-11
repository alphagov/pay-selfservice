const { InvalidConfigurationError } = require('../../errors')

module.exports = (req, res, next) => {
  const user = req.user
  if (user.isDegatewayed()) {
    return next()
  }
  return next(new InvalidConfigurationError(`User with id ${user.externalId} not opted in to account simplification or feature is disabled in this environment.`))
}
