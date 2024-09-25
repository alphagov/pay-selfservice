const { NotAuthorisedError } = require('../errors')

module.exports = function checkDegatewayParameters (req, res, next) {
  const user = req.user
  if (process.env.DEGATEWAY_FLAG === 'true' && user.features.includes('degatewayaccountification')) {
    return next()
  }
  return next(new NotAuthorisedError(`User with id ${user.externalId} not authorised to view page.`))
}
