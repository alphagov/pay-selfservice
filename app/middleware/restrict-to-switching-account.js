'use strict'

const { NotFoundError } = require('../errors')

module.exports = (req, res, next) => {
  if (req.account.provider_switch_enabled) {
    next()
  } else {
    next(new NotFoundError('This page is only available for accounts flagged for switching provider'))
  }
}
