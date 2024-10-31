const { updateBankAccount } = require('./clients/stripe/stripe.client')
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

module.exports = {
  updateStripeDetailsBankAccount
}
