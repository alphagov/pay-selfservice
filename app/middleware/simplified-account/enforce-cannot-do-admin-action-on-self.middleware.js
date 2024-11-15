const { NotFoundError } = require('../../errors')

module.exports = function getAdminActionOnSelfMiddleware (errorMessage) {
  return function adminActionOnSelf (req, res, next) {
    if (req.params.externalUserId === req.user.externalId) {
      next(new NotFoundError(errorMessage))
    } else {
      next()
    }
  }
}
