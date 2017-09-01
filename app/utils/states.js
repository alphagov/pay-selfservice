'use strict';

const changeCase = require('change-case')

const PAYMENT_STATE_DESCRIPTIONS = {
  'created': 'Service created payment',
  'started': 'User entering card details',
  'submitted': 'User submitted card details',
  'success': 'Payment successful',
  'error': 'Error processing payment',
  'failed': 'User failed to complete payment',
  'cancelled': 'Service cancelled payment'
}
const REFUND_STATE_DESCRIPTIONS = {
  'submitted': 'Refund submitted',
  'error': 'Error processing refund',
  'success': 'Refund successful'
}

exports.paymentStates = Object.keys(PAYMENT_STATE_DESCRIPTIONS).map(key => toSelectorObject( 'PAYMENT', key))
exports.refundStates = Object.keys(REFUND_STATE_DESCRIPTIONS).map(key => toSelectorObject('REFUND', key))
exports.states = [...exports.paymentStates, ...exports.refundStates]
exports.getDescription = (type = '', key = '') => {
  const origin = type.toLowerCase() === 'refund' ? REFUND_STATES_DESCRIPTIONS : PAYMENT_STATE_DESCRIPTIONS
  return origin[key.toLowerCase()]
}

function toSelectorObject (type = '', key = '') {
  return {
    type: type,
    key: key,
    value: {
      text: changeCase.upperCaseFirst(type.toLowerCase() === 'refund' ? 'refund' : '' + key.toLowerCase())
    }
  }
}