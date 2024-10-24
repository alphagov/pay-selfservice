const { NotFoundError } = require('../../errors')
const { LIVE } = require('../../models/go-live-stage')

module.exports = (req, res, next) => {
  const account = req.account
  const service = req.service
  if (account.type === 'test' && service.currentGoLiveStage === LIVE) {
    next(new NotFoundError('Attempted to access live only setting in sandbox mode for service that has gone live'))
  } else {
    next()
  }
}
