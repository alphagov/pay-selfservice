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
    emailCollectionMode: humaniseEmailMode(req.account.email_collection_mode),
    confirmationEmailEnabled: req.account.email_notifications.PAYMENT_CONFIRMED.enabled,
    refundEmailEnabled: req.account.email_notifications.REFUND_ISSUED && req.account.email_notifications.REFUND_ISSUED.enabled,
    allowMoto: req.account.allow_moto,
    motoMaskCardNumberInputEnabled: req.account.moto_mask_card_number_input,
    motoMaskSecurityCodeInputEnabled: req.account.moto_mask_card_security_code_input
  }

  return response(req, res, 'settings/index', pageData)
}
