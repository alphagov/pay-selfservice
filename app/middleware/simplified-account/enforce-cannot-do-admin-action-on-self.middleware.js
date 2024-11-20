const { NotAuthorisedError } = require('@root/errors')

module.exports = function getAdminActionOnSelfMiddleware (errorMessage) {
  return function adminActionOnSelf (req, res, next) {
    if (req.params.externalUserId === req.user.externalId) {
      next(new NotAuthorisedError(errorMessage))
    } else {
      next()
    }
  }
}
