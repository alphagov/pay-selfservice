'use strict'

function stripeSetupStageComplete (account, stage) {
  if (account.connectorGatewayAccountStripeProgress) {
    return account.connectorGatewayAccountStripeProgress[stage]
  }
  return false
}

function getStripeTaskList (targetCredential, account) {
  if (targetCredential.payment_provider === 'stripe') {
    return {
      'ENTER_BANK_DETAILS': {
        enabled: !stripeSetupStageComplete(account, 'bankAccount'),
        completed: stripeSetupStageComplete(account, 'bankAccount')
      },
      'ENTER_RESPONSIBLE_PERSON': {
        enabled: !stripeSetupStageComplete(account, 'responsiblePerson'),
        completed: stripeSetupStageComplete(account, 'responsiblePerson')
      },
      'ENTER_DIRECTOR': {
        enabled: !stripeSetupStageComplete(account, 'director'),
        completed: stripeSetupStageComplete(account, 'director')
      },
      'ENTER_VAT_NUMBER': {
        enabled: !stripeSetupStageComplete(account, 'vatNumber'),
        completed: stripeSetupStageComplete(account, 'vatNumber')
      },
      'ENTER_COMPANY_NUMBER': {
        enabled: !stripeSetupStageComplete(account, 'companyNumber'),
        completed: stripeSetupStageComplete(account, 'companyNumber')
      },
      'CONFIRM_ORGANISATION_DETAILS': {
        enabled: !stripeSetupStageComplete(account, 'organisationDetails'),
        completed: stripeSetupStageComplete(account, 'organisationDetails')
      },
      'UPLOAD_GOVERNMENT_ENTITY_DOCUMENT': {
        enabled: stripeSetupStageComplete(account, 'bankAccount') &&
          stripeSetupStageComplete(account, 'responsiblePerson') &&
          stripeSetupStageComplete(account, 'director') &&
          stripeSetupStageComplete(account, 'organisationDetails') &&
          stripeSetupStageComplete(account, 'vatNumber') &&
          stripeSetupStageComplete(account, 'companyNumber') &&
          !stripeSetupStageComplete(account, 'governmentEntityDocument'),
        completed: stripeSetupStageComplete(account, 'governmentEntityDocument')
      }
    }
  }
  throw new Error('Unsupported payment provider')
}

function stripeTaskListIsComplete (taskList) {
  return Object.values(taskList).every(task => task.completed)
}

module.exports = { getStripeTaskList, stripeTaskListIsComplete }
