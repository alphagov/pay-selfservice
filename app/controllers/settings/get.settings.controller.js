'use strict'

const { response } = require('../../utils/response')

const humaniseEmailMode = mode => {
  if (mode !== 'OFF') {
    return `On (${mode.toLowerCase()})`
  }
  return mode
}

module.exports = (req, res) => {
  const pageData = {
    supports3ds: req.account.supports3ds,
    requires3ds: req.account.requires3ds,
    collectBillingAddress: req.service.collectBillingAddress,
    emailCollectionMode: humaniseEmailMode(req.account.emailCollectionMode),
    confirmationEmailEnabled: req.account.emailEnabled,
    refundEmailEnabled: req.account.refundEmailEnabled
  }

  return response(req, res, 'settings/index', pageData)
}
