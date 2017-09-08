'use strict'

const lodash = require('lodash')
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

exports.payment_states = () => Object.keys(PAYMENT_STATE_DESCRIPTIONS).map(key => toSelectorObject('PAYMENT', key))
exports.refund_states = () => Object.keys(REFUND_STATE_DESCRIPTIONS).map(key => toSelectorObject('REFUND', key))
exports.states = () => [...exports.payment_states(), ...exports.refund_states()]
exports.getDisplayName = (type = 'payment', name = '') => {
  const origin = exports.states().find(event => event.name === name.toLowerCase() && event.type === type.toLowerCase())
  return lodash.get(origin, `value.text`, changeCase.upperCaseFirst(name.toLowerCase()))
}
exports.getDescription = (type = '', name = '') => {
  const origin = type.toLowerCase() === 'refund' ? REFUND_STATE_DESCRIPTIONS : PAYMENT_STATE_DESCRIPTIONS
  return origin[name.toLowerCase()]
}

function toSelectorObject (type = '', name = '') {
  return {
    type: type.toLowerCase(),
    name: name.toLowerCase(),
    key: `${type.toLowerCase()}-${name.toLowerCase()}`,
    value: {
      text: changeCase.upperCaseFirst((type.toLowerCase() === 'refund' ? 'refund ' : '') + name.toLowerCase())
    }
  }
}
