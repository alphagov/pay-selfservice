'use strict'

const { retrieveAccountDetails } = require('../../services/clients/stripe/stripe.client')
const lodash = require('lodash')

function entityVerificationDocumentUploaded (stripeAccount) {
  const fileId = lodash.get(stripeAccount, 'company.verification.document.front')
  return isNotEmpty(fileId)
}

function isOrganisationUrlComplete (stripeAccount) {
  const url = lodash.get(stripeAccount, 'business_profile.url')

  return isNotEmpty(url)
}

function isNotEmpty (value) {
  return !(value === undefined || value === null) && value.length > 0
}

async function getTaskList (activeCredential) {
  const stripeAccountId = lodash.get(activeCredential, 'credentials.stripe_account_id')

  const stripeAccount = await retrieveAccountDetails(stripeAccountId)

  return {
    'ENTER_ORGANISATION_URL': {
      complete: isOrganisationUrlComplete(stripeAccount)
    }
  }
}

function isComplete (taskList) {
  return Object.values(taskList).every(task => task.complete)
}

async function isKycTaskListComplete (activeCredential) {
  const taskList = await getTaskList(activeCredential)
  return isComplete(taskList)
}

module.exports = {
  getTaskList,
  isComplete,
  isKycTaskListComplete
}
