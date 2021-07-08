'use strict'
const { response } = require('../../utils/response')
const formatAccountPathsFor = require('../../utils/format-account-paths-for')
const formatPSPName = require('../../utils/format-PSP-name')
const paths = require('../../paths')
const switchTasks = require('./switch-tasks.service')
const { getSwitchingCredential, getCurrentCredential } = require('../../utils/credentials')
const { ConnectorClient } = require('../../services/clients/connector.client')
const connectorClient = new ConnectorClient(process.env.CONNECTOR_URL)

function switchPSPPage (req, res, next) {
  try {
    const targetCredential = getSwitchingCredential(req.account)
    const taskList = switchTasks.getTaskList(targetCredential, req.account)
    const taskListIsComplete = switchTasks.isComplete(taskList)
    const context = { targetCredential, taskList, taskListIsComplete }
    response(req, res, 'switch-psp/switch-psp', context)
  } catch (error) {
    next(error)
  }
}

async function submitSwitchPSP (req, res, next) {
  try {
    const currentCredential = getCurrentCredential(req.account)
    const targetCredential = getSwitchingCredential(req.account)
    const taskList = switchTasks.getTaskList(targetCredential, req.account)
    const taskListIsComplete = switchTasks.isComplete(taskList)

    if (!taskListIsComplete) {
      req.flash('genericError', 'You cannot switch providers until all required tasks are completed')
      return res.redirect(formatAccountPathsFor(paths.account.switchPSP.index, req.account.external_id))
    }

    await connectorClient.postAccountSwitchPSP(req.account.gateway_account_id, {
      user_external_id: req.user.externalId,
      gateway_account_credential_external_id: targetCredential.external_id
    })
    req.flash(
      'switchPSPSuccess',
      `All future payments will be taken with ${formatPSPName(targetCredential.payment_provider)}. Your ${formatPSPName(currentCredential.payment_provider)} account is still live for processing refunds of payments made before the switch.`
    )
    res.redirect(formatAccountPathsFor(paths.account.yourPsp.index, req.account.external_id, targetCredential.external_id))
  } catch (error) {
    next(error)
  }
}

module.exports = { switchPSPPage, submitSwitchPSP }
