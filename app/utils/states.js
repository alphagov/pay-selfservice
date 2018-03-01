'use strict'

const lodash = require('lodash')
const changeCase = require('change-case')

const PAYMENT_STATE_DESCRIPTIONS = {
  'created': {
    displayName: 'In progress'
  },
  'started': {
    displayName: 'In progress'
  },
  'submitted': {
    displayName: 'In progress'
  },
  'success': {
    displayName: 'Success'
  },
  'error': {
    displayName: 'Error',
    errorCodes: ['P0050']
  },
  'failed': {
    displayName: 'Failed',
    errorCodes: ['P0010', 'P0020', 'P0030']
  },
  'cancelled': {
    displayName: 'Cancelled',
    errorCodes: ['P0040']
  }
}

const REFUND_STATE_DESCRIPTIONS = {
  'submitted': {
    description: 'Refund submitted',
    displayName: 'Refund submitted'
  },
  'error': {
    description: 'Error processing refund',
    displayName: 'Refund error'
  },
  'success': {
    description: 'Refund successful',
    displayName: 'Refund success'
  }
}

const ERROR_CODE_TO_DISPLAY_STATE = {
  'P0010': 'Declined',
  'P0020': 'Timed out',
  'P0030': 'Cancelled',
  'P0040': 'Cancelled',
  'P0050': 'Error'
}

exports.allDisplayStates = () => [... uniqueDisplayStates(PAYMENT_STATE_DESCRIPTIONS), ... uniqueDisplayStates(REFUND_STATE_DESCRIPTIONS)]
exports.displayStatesToConnectorStates = (displayStatesArray) => toConnectorStates(displayStatesArray)
exports.allDisplayStateSelectorObjects = () => exports.allDisplayStates().map(state => toSelectorObject(state))
exports.getDisplayNameForConnectorState = (connectorState, type = 'payment') => {
  return displayNameForConnectorState(connectorState, type)
}

// TODO: leaving this toSelector Object structure for backward compatibility.
//       Simplify this when removing the feature flag for displaying the new payment states (PP-3377)
function toSelectorObject (displayName = '') {
  return {
    type: displayName, //to remove
    name: displayName,
    key: `${displayName}`, //to remove
    value: {
      text: displayName
    }
  }
}

function uniqueDisplayStates (stateDescriptions) {
  const result = lodash.flattenDeep(Object.keys(stateDescriptions).map(key => {
    if (stateDescriptions[key].errorCodes) {
      return stateDescriptions[key].errorCodes.map(errorCode => ERROR_CODE_TO_DISPLAY_STATE[errorCode])
    }
    return stateDescriptions[key].displayName
  }))
  return lodash.uniq(result)
}

function displayNameForConnectorState (connectorState, type) {
  if (connectorState.code && ERROR_CODE_TO_DISPLAY_STATE[connectorState.code]) {
    return ERROR_CODE_TO_DISPLAY_STATE[connectorState.code]
  }
  return getDisplayNameFromConnectorState(connectorState, type)
}

function getDisplayNameFromConnectorState (connectorState, type = 'payment') {
  if (type === 'payment') {
    const found = Object.keys(PAYMENT_STATE_DESCRIPTIONS).find(connectorPaymentState => connectorPaymentState === connectorState.status.toLowerCase())
    if (found) {
      return lodash.get(PAYMENT_STATE_DESCRIPTIONS, `${found}.displayName`, '')
    }
  } else {
    const found = Object.keys(REFUND_STATE_DESCRIPTIONS).find(refundPaymentState => refundPaymentState === connectorState.status.toLowerCase())
    if (found) {
      return lodash.get(REFUND_STATE_DESCRIPTIONS, `${found}.displayName`, '')
    }
  }
  return ''
}

function toConnectorStates (displayStates) {
  const result = {
    payment_states: [],
    refund_states: [],
  }
  displayStates.forEach(displayState => {
    Object.keys(PAYMENT_STATE_DESCRIPTIONS).forEach(connectorPaymentState => {
      if (PAYMENT_STATE_DESCRIPTIONS[connectorPaymentState].errorCodes) {
        const found = PAYMENT_STATE_DESCRIPTIONS[connectorPaymentState].errorCodes.find(errorCode => ERROR_CODE_TO_DISPLAY_STATE[errorCode] === displayState)
        if (found) {
          result.payment_states.push(connectorPaymentState)
        }
      } else {
        if (PAYMENT_STATE_DESCRIPTIONS[connectorPaymentState].displayName === displayState) {
          result.payment_states.push(connectorPaymentState)
        }
      }
    })

    Object.keys(REFUND_STATE_DESCRIPTIONS).forEach(refundPaymentState => {
      if (REFUND_STATE_DESCRIPTIONS[refundPaymentState].displayName === displayState) {
        result.refund_states.push(refundPaymentState)
      }
    })
  })
  result.payment_states = lodash.uniq(result.payment_states)
  result.refund_states = lodash.uniq(result.refund_states)
  return result
}

// OLD Status code logic from here onwards -- TO REMOVE once the feature flag is taken off (PP-3377)
// ------------------------------------------------------------------------------------------

const OLD_PAYMENT_STATE_DESCRIPTIONS = {
  'created': 'Service created payment',
  'started': 'User entering card details',
  'submitted': 'User submitted card details',
  'success': 'Payment successful',
  'error': 'Error processing payment',
  'failed': 'User failed to complete payment',
  'cancelled': 'Service cancelled payment'
}
const OLD_REFUND_STATE_DESCRIPTIONS = {
  'submitted': 'Refund submitted',
  'error': 'Error processing refund',
  'success': 'Refund successful'
}

exports.old_payment_states = () => Object.keys(OLD_PAYMENT_STATE_DESCRIPTIONS).map(key => old_toSelectorObject('PAYMENT', key))
exports.old_refund_states = () => Object.keys(OLD_REFUND_STATE_DESCRIPTIONS).map(key => old_toSelectorObject('REFUND', key))
exports.old_states = () => [...exports.old_payment_states(), ...exports.old_refund_states()]
exports.old_getDisplayName = (type = 'payment', name = '') => {
  const origin = exports.old_states().find(event => event.name === name.toLowerCase() && event.type === type.toLowerCase())
  return lodash.get(origin, `value.text`, changeCase.upperCaseFirst(name.toLowerCase()))
}
exports.old_getDescription = (type = '', name = '') => {
  const origin = type.toLowerCase() === 'refund' ? OLD_REFUND_STATE_DESCRIPTIONS : OLD_PAYMENT_STATE_DESCRIPTIONS
  return origin[name.toLowerCase()]
}

function old_toSelectorObject (type = '', name = '') {
  return {
    type: type.toLowerCase(),
    name: name.toLowerCase(),
    key: `${type.toLowerCase()}-${name.toLowerCase()}`,
    value: {
      text: changeCase.upperCaseFirst((type.toLowerCase() === 'refund' ? 'refund ' : '') + name.toLowerCase())
    }
  }
}
