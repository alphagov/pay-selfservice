'use strict'

const { CREDENTIAL_STATE } = require('../../utils/credentials')

function linkCredentialsComplete (targetCredential) {
  return [CREDENTIAL_STATE.ENTERED, CREDENTIAL_STATE.VERIFIED, CREDENTIAL_STATE.ACTIVE, CREDENTIAL_STATE.RETIRED]
    .includes(targetCredential.state)
}

function verifyPSPIntegrationComplete (targetCredential) {
  return [CREDENTIAL_STATE.VERIFIED, CREDENTIAL_STATE.ACTIVE, CREDENTIAL_STATE.RETIRED]
    .includes(targetCredential.state)
}

function stripeSetupStageComplete(account, stage) {
  if (account.connectorGatewayAccountStripeProgress) {
    return account.connectorGatewayAccountStripeProgress[stage]
  }
  return false
}

function getTaskList (targetCredential, account) {
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
      'ENTER_BANK_DETAILS': {
        enabled: !stripeSetupStageComplete(account, 'bankAccount'),
        complete: stripeSetupStageComplete(account, 'bankAccount')
      },
      'ENTER_RESPONSIBLE_PERSON': {
        enabled: !stripeSetupStageComplete(account, 'responsiblePerson'),
        complete: stripeSetupStageComplete(account, 'responsiblePerson')
      },
      'ENTER_VAT_NUMBER': {
        enabled: !stripeSetupStageComplete(account, 'vatNumber'),
        complete: stripeSetupStageComplete(account, 'vatNumber')
      },
      'ENTER_COMPANY_NUMBER': {
        enabled: !stripeSetupStageComplete(account, 'companyNumber'),
        complete: stripeSetupStageComplete(account, 'companyNumber')
      },
      'VERIFY_PSP_INTEGRATION': {
        enabled: stripeSetupStageComplete(account, 'bankAccount') &&
          stripeSetupStageComplete(account, 'responsiblePerson') &&
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
