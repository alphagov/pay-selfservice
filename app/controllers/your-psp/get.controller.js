'use strict'

const { response } = require('../../utils/response')
const {
  getCredentialByExternalId,
  getCurrentCredential,
  getSwitchingCredentialIfExists,
  hasSwitchedProvider
} = require('../../utils/credentials')
const yourPspTasks = require('./your-psp-tasks.service')

module.exports = async (req, res, next) => {
  const { credentialId } = req.params
  const enableStripeOnboardingTaskList = process.env.ENABLE_STRIPE_ONBOARDING_TASK_LIST === 'true'

  try {
    const credential = getCredentialByExternalId(req.account, credentialId)
    const activeCredential = getCurrentCredential(req.account)
    const switchingCredential = getSwitchingCredentialIfExists(req.account)
    const switchedProvider = hasSwitchedProvider(req.account)

    const isWorldpay3dsFlexCredentialsConfigured = req.account.worldpay_3ds_flex &&
      req.account.worldpay_3ds_flex.organisational_unit_id !== undefined &&
      req.account.worldpay_3ds_flex.organisational_unit_id.length > 0

    const is3dsEnabled = req.account.requires3ds === true
    const isMotoEnabled = req.account.allow_moto === true

    let stripeData = {}
    if (activeCredential && activeCredential.payment_provider === 'stripe') {
      stripeData.taskList = yourPspTasks.getStripeTaskList(activeCredential, req.account)
      stripeData.taskListIsComplete = yourPspTasks.stripeTaskListIsComplete(stripeData.taskList)
      stripeData.progressIndicator = yourPspTasks.stripeTaskListNumberOftasksComplete(stripeData.taskList)
    }

    const isWorldpay3dsFlexEnabled = is3dsEnabled && req.account.integration_version_3ds === 2

    return response(req, res, 'your-psp/index', {
      credential,
      activeCredential,
      switchingCredential,
      switchedProvider,
      is3dsEnabled,
      isMotoEnabled,
      isWorldpay3dsFlexEnabled,
      isWorldpay3dsFlexCredentialsConfigured,
      ...stripeData,
      enableStripeOnboardingTaskList
    })
  } catch (error) {
    next(error)
  }
}
