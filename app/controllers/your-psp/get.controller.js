'use strict'

const { response } = require('../../utils/response')
const {
  getCredentialByExternalId,
  getCurrentCredential,
  getSwitchingCredentialIfExists,
  hasSwitchedProvider
} = require('../../utils/credentials')
const { getTaskList, isComplete } = require('./kyc-tasks.service')
const yourPspTasks = require('./your-psp-tasks.service')


module.exports = async (req, res, next) => {
  const { credentialId } = req.params
  const enableStripeOnboardingTaskList = process.env.ENABLE_STRIPE_ONBOARDING_TASK_LIST === 'true'

  try {
    const credential = getCredentialByExternalId(req.account, credentialId)
    const activeCredential = getCurrentCredential(req.account)
    const switchingCredential = getSwitchingCredentialIfExists(req.account)
    const isAccountCredentialsConfigured = credential.credentials && credential.credentials.merchant_id !== undefined
    const switchedProvider = hasSwitchedProvider(req.account)

    const isWorldpay3dsFlexCredentialsConfigured = req.account.worldpay_3ds_flex &&
      req.account.worldpay_3ds_flex.organisational_unit_id !== undefined &&
      req.account.worldpay_3ds_flex.organisational_unit_id.length > 0

    const is3dsEnabled = req.account.requires3ds === true
    const isMotoEnabled = req.account.allow_moto === true

    let stripeData = {}
    if (activeCredential && activeCredential.payment_provider === 'stripe') {
      stripeData.requiresAdditionalKycData = req.account.requires_additional_kyc_data === true
      const kycCompleted = req.account.connectorGatewayAccountStripeProgress && req.account.connectorGatewayAccountStripeProgress.additionalKycData
      if (stripeData.requiresAdditionalKycData || kycCompleted) {
        stripeData.kycTaskList = await getTaskList(activeCredential)
        stripeData.kycTaskListComplete = isComplete(stripeData.kycTaskList)
      } else {
        stripeData.taskList = yourPspTasks.getStripeTaskList(activeCredential, req.account)
        stripeData.taskListIsComplete = yourPspTasks.stripeTaskListIsComplete(stripeData.taskList)
      }
    }

    const isWorldpay3dsFlexEnabled = is3dsEnabled && req.account.integration_version_3ds === 2

    return response(req, res, 'your-psp/index', {
      credential,
      activeCredential,
      switchingCredential,
      switchedProvider,
      isAccountCredentialsConfigured,
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
