const { updateBankAccount, listPersons, updatePerson, createPerson, updateCompany } = require('./clients/stripe/stripe.client')
const { ConnectorClient } = require('./clients/connector.client')
const logger = require('../utils/logger')(__filename)
const connector = new ConnectorClient(process.env.CONNECTOR_URL)

/**
 * Updates Stripe account bank details for the given service and account type
 * @param account {GatewayAccount}
 * @param service {GOVUKPayService}
 * @param sortCode {string}
 * @param accountNumber {string}
 */
const updateStripeDetailsBankAccount = async (service, account, sortCode, accountNumber) => {
  const stripeAccount = await connector.getStripeAccountByServiceIdAndAccountType(service.externalId, account.type)
  await updateBankAccount(stripeAccount.stripeAccountId, {
    bank_account_sort_code: sortCode,
    bank_account_number: accountNumber
  })
  await connector.setStripeAccountSetupFlagByServiceIdAndAccountType(service.externalId, account.type, 'bank_account')
  logger.info('Bank account details submitted for Stripe account', {
    stripe_account_id: stripeAccount.stripeAccountId
  })
}

/**
 * Updates Stripe account responsible person for the given service and account type
 * @param account {GatewayAccount}
 * @param service {GOVUKPayService}
 * @param responsiblePerson {object}
 */
const updateStipeDetailsResponsiblePerson = async (service, account, responsiblePerson) => {
  const stripeAccount = await connector.getStripeAccountByServiceIdAndAccountType(service.externalId, account.type)
  const stripePersonsResponse = await listPersons(stripeAccount.stripeAccountId)
  const possiblyExistingResponsiblePerson = stripePersonsResponse.data.filter(person => person.relationship && person.relationship.representative).pop()
  if (possiblyExistingResponsiblePerson !== undefined) {
    await updatePerson(stripeAccount.stripeAccountId, possiblyExistingResponsiblePerson.id, responsiblePerson)
  } else {
    await createPerson(stripeAccount.stripeAccountId, responsiblePerson)
  }
  await updateCompany(stripeAccount.stripeAccountId, { executives_provided: true })
  await connector.setStripeAccountSetupFlagByServiceIdAndAccountType(service.externalId, account.type, 'responsible_person')
  logger.info('Responsible person details submitted for Stripe account', {
    stripe_account_id: stripeAccount.stripeAccountId
  })
}

module.exports = {
  updateStripeDetailsBankAccount,
  updateStipeDetailsResponsiblePerson
}
