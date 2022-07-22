'use strict'

const lodash = require('lodash')

const PAYMENT_STATE_DESCRIPTIONS = {
  'created': {
    displayName: 'In progress',
    eventDisplayName: 'Created'
  },
  'started': {
    displayName: 'In progress',
    eventDisplayName: 'Started'
  },
  'submitted': {
    displayName: 'In progress',
    eventDisplayName: 'Submitted'
  },
  'capturable': {
    displayName: 'In progress',
    eventDisplayName: 'Capturable'
  },
  'success': {
    displayName: 'Success'
  },
  'declined': {
    displayName: 'Declined'
  },
  'timedout': {
    displayName: 'Timed out'
  },
  'cancelled': {
    displayName: 'Cancelled'
  },
  'error': {
    displayName: 'Error'
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

const DISPUTE_STATE_DESCRIPTIONS = {
  'needs_response': {
    displayName: 'Dispute awaiting evidence'
  },
  'under_review': {
    displayName: 'Dispute under review'
  },
  'won': {
    displayName: 'Dispute won in your favour'
  },
  'lost': {
    displayName: 'Dispute lost to customer'
  }
}

const ERROR_CODE_TO_DISPLAY_STATE = {
  'P0010': 'Declined',
  'P0020': 'Timed out',
  'P0030': 'Cancelled'
}

exports.allDisplayStates = () => [...uniqueDisplayStates(PAYMENT_STATE_DESCRIPTIONS), ...uniqueDisplayStates(REFUND_STATE_DESCRIPTIONS)]
exports.displayStatesToConnectorStates = (displayStatesArray) => toConnectorStates(displayStatesArray)
exports.allDisplayStateSelectorObjects = (includeDisputeStatuses) => {
  let allDisplayStates = exports.allDisplayStates()

  if (includeDisputeStatuses) {
    allDisplayStates = allDisplayStates.concat(uniqueDisplayStates(DISPUTE_STATE_DESCRIPTIONS))
  }

  return allDisplayStates.map(state => toSelectorObject(state))
}
exports.getDisplayNameForConnectorState = (connectorState, type = 'payment') => {
  const sanitisedType = (type.toLowerCase() === 'charge') ? 'payment' : type.toLowerCase()
  return displayNameForConnectorState(connectorState, sanitisedType).displayName
}

// TODO: leaving this toSelector Object structure for backward compatibility.
//       Simplify this when removing the feature flag for displaying the new payment states (PP-3377)
function toSelectorObject (displayName = '') {
  return {
    type: displayName, // to remove
    name: displayName,
    key: `${displayName}`, // to remove
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
  if (connectorState.status === 'failed') {
    return { displayName: ERROR_CODE_TO_DISPLAY_STATE[connectorState.code] }
  }
  return getDisplayNameFromConnectorState(connectorState, type)
}

function getDisplayNameFromConnectorState (connectorState, type = 'payment') {
  let stateToConvert = connectorState.status || connectorState
  if (type === 'payment') {
    if (PAYMENT_STATE_DESCRIPTIONS[stateToConvert.toLowerCase()]) {
      return PAYMENT_STATE_DESCRIPTIONS[stateToConvert.toLowerCase()]
    }
  } else if (type === 'refund') {
    if (REFUND_STATE_DESCRIPTIONS[stateToConvert.toLowerCase()]) {
      return REFUND_STATE_DESCRIPTIONS[stateToConvert.toLowerCase()]
    }
  } else if (type === 'dispute' && DISPUTE_STATE_DESCRIPTIONS[stateToConvert.toLowerCase()]) {
    return DISPUTE_STATE_DESCRIPTIONS[stateToConvert.toLowerCase()]
  }
  return { displayName: '', eventDisplayName: '' }
}

function toConnectorStates (displayStates) {
  const result = {
    payment_states: [],
    refund_states: [],
    dispute_states: []
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

    Object.keys(DISPUTE_STATE_DESCRIPTIONS).forEach(disputeState => {
      if (DISPUTE_STATE_DESCRIPTIONS[disputeState].displayName === displayState) {
        result.dispute_states.push(disputeState)
      }
    })
  })

  result.payment_states = lodash.uniq(result.payment_states)
  result.refund_states = lodash.uniq(result.refund_states)
  result.dispute_states = lodash.uniq(result.dispute_states)
  return result
}

exports.getEventDisplayNameForConnectorState = (state, type) => {  // eslint-disable-line
  const displayName = displayNameForConnectorState(state, type.toLowerCase())
  if (displayName.eventDisplayName) {
    return displayName.eventDisplayName
  } else {
    return displayName.displayName
  }
}
