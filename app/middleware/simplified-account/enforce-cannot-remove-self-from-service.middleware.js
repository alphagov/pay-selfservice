const { NotFoundError } = require('../../errors')

module.exports = (req, res, next) => {
  if (req.params.externalUserId === req.user.externalId) {
    next(new NotFoundError('Attempted to remove self from service'))
  } else {
    next()
  }
}
