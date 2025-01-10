'use strict'
const { response } = require('../../utils/response')
const formatAccountPathsFor = require('../../utils/format-account-paths-for')
const formatPSPName = require('../../utils/format-PSP-name')
const paths = require('../../paths')
const switchTasks = require('./switch-tasks.service')
const { getSwitchingCredential, getActiveCredential } = require('../../utils/credentials')
const { ConnectorClient } = require('../../services/clients/connector.client')
const connectorClient = new ConnectorClient(process.env.CONNECTOR_URL)

function switchPSPPage (req, res, next) {
  try {
    const targetCredential = getSwitchingCredential(req.account)
    const taskList = switchTasks.getTaskList(targetCredential, req.account, req.service)
    const taskListIsComplete = switchTasks.isComplete(taskList)
    const context = { targetCredential, taskList, taskListIsComplete }
    response(req, res, 'switch-psp/switch-psp', context)
  } catch (error) {
    next(error)
  }
}

async function submitSwitchPSP (req, res, next) {
  try {
    const currentCredential = getActiveCredential(req.account)
    const targetCredential = getSwitchingCredential(req.account)
    const taskList = switchTasks.getTaskList(targetCredential, req.account, req.service)
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
      `Your service is now taking payments through ${formatPSPName(targetCredential.payment_provider)}. You can still process refunds of previous payments through ${formatPSPName(currentCredential.payment_provider)}.`
    )
    res.redirect(formatAccountPathsFor(paths.account.yourPsp.index, req.account.external_id, targetCredential.external_id))
  } catch (error) {
    next(error)
  }
}

module.exports = { switchPSPPage, submitSwitchPSP }
