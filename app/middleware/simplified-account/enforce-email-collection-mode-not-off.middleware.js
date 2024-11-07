const { NotFoundError } = require('../../errors')

module.exports = (req, res, next) => {
  if (req.account.email_collection_mode === 'OFF') {
    next(new NotFoundError('Attempted to access Payment confirmation emails or Refund emails setting whilst ' +
      'email_collection_mode is OFF.'))
  } else {
    next()
  }
}
