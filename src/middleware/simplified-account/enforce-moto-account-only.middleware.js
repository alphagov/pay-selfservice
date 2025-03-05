const { NotFoundError } = require('@root/errors')

module.exports = (req, res, next) => {
  const account = req.account
  const service = req.service
  const user = req.user
  if (account.allowMoto) {
    next()
  } else {
    next(new NotFoundError(`Attempted to access MOTO only setting [service_external_id: ${service.externalId}, user_external_id: ${user.externalId}]`))
  }
}
