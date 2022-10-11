'use strict'

const { CREDENTIAL_STATE } = require('../../utils/credentials')
const lodash = require('lodash')

function linkCredentialsComplete (targetCredential) {
  return [CREDENTIAL_STATE.ENTERED, CREDENTIAL_STATE.VERIFIED, CREDENTIAL_STATE.ACTIVE, CREDENTIAL_STATE.RETIRED]
    .includes(targetCredential.state)
}

function verifyPSPIntegrationComplete (targetCredential) {
  return [CREDENTIAL_STATE.VERIFIED, CREDENTIAL_STATE.ACTIVE, CREDENTIAL_STATE.RETIRED]
    .includes(targetCredential.state)
}

function stripeSetupStageComplete (account, stage) {
  if (account.connectorGatewayAccountStripeProgress) {
    return account.connectorGatewayAccountStripeProgress[stage]
  }
  return false
}

function organisationUrlComplete (service) {
  const organisationUrl = lodash.get(service, 'merchantDetails.url', '')
  return organisationUrl && organisationUrl.length > 0
}

function getTaskList (targetCredential, account, service) {
  if (targetCredential.payment_provider === 'worldpay') {
    return {
      'LINK_CREDENTIALS': {
        enabled: true,
        complete: linkCredentialsComplete(targetCredential)
      },
      'VERIFY_PSP_INTEGRATION': {
        enabled: linkCredentialsComplete(targetCredential),
        complete: verifyPSPIntegrationComplete(targetCredential)
      }
    }
  } else if (targetCredential.payment_provider === 'stripe') {
    return {
      'ENTER_ORGANISATION_URL': {
        enabled: !organisationUrlComplete(service),
        complete: organisationUrlComplete(service)
      },
      'ENTER_BANK_DETAILS': {
        enabled: !stripeSetupStageComplete(account, 'bankAccount'),
        complete: stripeSetupStageComplete(account, 'bankAccount')
      },
      'ENTER_RESPONSIBLE_PERSON': {
        enabled: !stripeSetupStageComplete(account, 'responsiblePerson'),
        complete: stripeSetupStageComplete(account, 'responsiblePerson')
      },
      'ENTER_DIRECTOR': {
        enabled: !stripeSetupStageComplete(account, 'director'),
        complete: stripeSetupStageComplete(account, 'director')
      },
      'ENTER_VAT_NUMBER': {
        enabled: !stripeSetupStageComplete(account, 'vatNumber'),
        complete: stripeSetupStageComplete(account, 'vatNumber')
      },
      'ENTER_COMPANY_NUMBER': {
        enabled: !stripeSetupStageComplete(account, 'companyNumber'),
        complete: stripeSetupStageComplete(account, 'companyNumber')
      },
      'CONFIRM_ORGANISATION_DETAILS': {
        enabled: !stripeSetupStageComplete(account, 'organisationDetails'),
        complete: stripeSetupStageComplete(account, 'organisationDetails')
      },
      'UPLOAD_GOVERNMENT_ENTITY_DOCUMENT': {
        enabled: !stripeSetupStageComplete(account, 'governmentEntityDocument'),
        complete: stripeSetupStageComplete(account, 'governmentEntityDocument')
      },
      'VERIFY_PSP_INTEGRATION': {
        enabled: organisationUrlComplete(service) &&
          stripeSetupStageComplete(account, 'bankAccount') &&
          stripeSetupStageComplete(account, 'responsiblePerson') &&
          stripeSetupStageComplete(account, 'director') &&
          stripeSetupStageComplete(account, 'organisationDetails') && 
          stripeSetupStageComplete(account, 'governmentEntityDocument') &&
          stripeSetupStageComplete(account, 'vatNumber') &&
          stripeSetupStageComplete(account, 'companyNumber'),
        complete: verifyPSPIntegrationComplete(targetCredential)
      }
    }
  }
  throw new Error('Unsupported payment provider')
}

function isComplete (taskList) {
  return Object.values(taskList).every(task => task.complete)
}

module.exports = { getTaskList, isComplete }
