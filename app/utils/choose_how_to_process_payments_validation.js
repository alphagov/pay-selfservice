'use strict'

// NPM dependencies
const lodash = require('lodash')

const PSP = 'choose-how-to-process-payments-mode'
const PSP_OTHER = 'choose-how-to-process-payments-mode-other'

exports.validateProcessPaymentOptions = (values) => {
  const psp = lodash.get(values, PSP)
  const pspOther = lodash.get(values, PSP_OTHER)
  let errors
  if (psp === undefined && pspOther === undefined) {
    errors = 'You need to select an option'
  } else if (psp === 'other_psp' && pspOther === undefined) {
    errors = 'You need to select one of Worldpay, Smartpay or ePDQ'
  }
  return errors
}
