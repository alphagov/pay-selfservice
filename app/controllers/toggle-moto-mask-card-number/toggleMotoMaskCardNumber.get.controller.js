'use strict'

const { response } = require('../../utils/response')

module.exports = function showToggleMaskCardNumberPage(req, res) {
  const pageData = {
    allowMoto: req.account.allow_moto,
    motoMaskCardNumberInputEnabled: req.account.moto_mask_card_number_input
  }

  response(req, res, 'toggle-moto-mask-card-number/index', pageData)
}
