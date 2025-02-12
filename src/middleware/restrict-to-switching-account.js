'use strict'

const { NotFoundError } = require('../errors')

module.exports = (req, res, next) => {
  if (req.account.provider_switch_enabled || req.account.providerSwitchEnabled) {
    next()
  } else {
    next(new NotFoundError('This page is only available for accounts flagged for switching provider'))
  }
}
