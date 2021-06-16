'use strict'

const { CREDENTIAL_STATE } = require('../../utils/credentials')

function linkCredentialsComplete (targetCredential) {
  return [CREDENTIAL_STATE.ENTERED, CREDENTIAL_STATE.VERIFIED, CREDENTIAL_STATE.ACTIVE, CREDENTIAL_STATE.RETIRED]
    .includes(targetCredential.state)
}

function getTaskList (targetCredential, account) {
  if (targetCredential.payment_provider === 'worldpay') {
    return {
      'LINK_CREDENTIALS': {
        enabled: true,
        complete: linkCredentialsComplete(targetCredential)
      }
    }
  }
  throw new Error('Unsupported payment provider')
}

function isComplete (taskList) {
  return Object.values(taskList).every(task => task.complete)
}

module.exports = { getTaskList, isComplete }
