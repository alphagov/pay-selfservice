'use strict'
const { response } = require('../../utils/response')
const switchTasks = require('./switch-tasks.service')
const { getSwitchingCredential } = require('../../utils/credentials')
const {
  VERIFY_PSP_INTEGRATION_STATUS_KEY,
  VERIFY_PSP_INTEGRATION_CHARGE_EXTERNAL_ID_KEY,
  VERIFY_PSP_INTEGRATION_STATUS
} = require('../../utils/verify-psp-integration')

function switchPSPPage (req, res, next) {
  try {
    const targetCredential = getSwitchingCredential(req.account)
    const taskList = switchTasks.getTaskList(targetCredential, req.account)
    const context = { targetCredential, taskList, VERIFY_PSP_INTEGRATION_STATUS }

    if (req.session[VERIFY_PSP_INTEGRATION_STATUS_KEY]) {
      context.verifyPSPIntegrationResult = req.session[VERIFY_PSP_INTEGRATION_STATUS_KEY]
      delete req.session[VERIFY_PSP_INTEGRATION_STATUS_KEY]
      delete req.session[VERIFY_PSP_INTEGRATION_CHARGE_EXTERNAL_ID_KEY]
    }
    response(req, res, 'switch-psp/switch-psp', context)
  } catch (error) {
    next(error)
  }
}

module.exports = { switchPSPPage }
