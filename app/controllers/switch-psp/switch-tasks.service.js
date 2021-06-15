'use strict'

const { CREDENTIAL_STATE } = require('../../utils/credentials')

const defaultTrue = () => true

const credentialsComplete = function credentialsComplete (targetCredential, account) {
  return [ CREDENTIAL_STATE.ENTERED, CREDENTIAL_STATE.VERIFIED, CREDENTIAL_STATE.ACTIVE, CREDENTIAL_STATE.RETIRED ]
    .includes(targetCredential.state)
}

const worldpayTaskList = [{
  key: 'LINK_CREDENTIALS',
  isEnabled: defaultTrue,
  isComplete: credentialsComplete
}]

const providerTaskListMap = {
  worldpay: worldpayTaskList
}

function getStatusesFor (targetCredential, account) {
  const schema = providerTaskListMap[targetCredential.payment_provider]
  const taskList = schema.reduce((aggregate, taskItem) => {
    aggregate[taskItem.key] = {
      enabled: taskItem.isEnabled(targetCredential, account),
      complete: taskItem.isComplete(targetCredential, account)
    }
    return aggregate
  }, {})
  return taskList
}

function isComplete (taskList) {
  return Object.entries(taskList)
    .some(([ taskItemKey, taskItemStatus ]) => taskItemStatus.complete)
}

module.exports = { getStatusesFor, isComplete }
