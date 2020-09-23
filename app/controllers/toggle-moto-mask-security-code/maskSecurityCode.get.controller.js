'use strict'

const { response } = require('../../utils/response')

module.exports = function showToggleMaskCardSecurityCodePage (req, res) {
  const pageData = {
    allowMoto: req.account.allow_moto,
    motoMaskCardNumberInputEnabled: req.account.moto_mask_card_number_input,
    motoMaskCardSecurityCodeInputEnabled: req.account.moto_mask_card_security_code_input
  }

  response(req, res, 'toggle-moto-mask-security-code/index', pageData)
}
