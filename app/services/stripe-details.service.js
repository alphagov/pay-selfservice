const { ConnectorClient } = require('./clients/connector.client')
const {
  updateDirector, createDirector, updateBankAccount,
  listPersons, updatePerson, createPerson,
  updateCompany, uploadFile, updateAccount, retrieveAccountDetails, listBankAccount
} = require('@services/clients/stripe/stripe.client')
const logger = require('../utils/logger')(__filename)
const connector = new ConnectorClient(process.env.CONNECTOR_URL)

/**
 * Updates Stripe account bank details for the given service and account type
 * @param {GatewayAccount} account
 * @param {GOVUKPayService} service
 * @param {string} sortCode
 * @param {string} accountNumber
 */
const updateStripeDetailsBankAccount = async (service, account, sortCode, accountNumber) => {
  const stripeAccount = await connector.getStripeAccountByServiceIdAndAccountType(service.externalId, account.type)
  await updateBankAccount(stripeAccount.stripeAccountId, {
    bank_account_sort_code: sortCode,
    bank_account_number: accountNumber
  })
  await updateConnectorStripeProgress(service, account, 'bank_account')
  logger.info('Bank account details submitted for Stripe account', {
    stripe_account_id: stripeAccount.stripeAccountId
  })
}

/**
 * Updates Stripe account responsible person for the given service and account type
 * @param {GatewayAccount} account
 * @param {GOVUKPayService} service
 * @param {StripePersonParams} responsiblePerson
 */
const updateStripeDetailsResponsiblePerson = async (service, account, responsiblePerson) => {
  const stripeAccount = await connector.getStripeAccountByServiceIdAndAccountType(service.externalId, account.type)
  const stripePersonsResponse = await listPersons(stripeAccount.stripeAccountId)
  const possiblyExistingResponsiblePerson = stripePersonsResponse.data.filter(person => person.relationship && person.relationship.representative).pop()
  if (possiblyExistingResponsiblePerson !== undefined) {
    await updatePerson(stripeAccount.stripeAccountId, possiblyExistingResponsiblePerson.id, responsiblePerson)
  } else {
    await createPerson(stripeAccount.stripeAccountId, responsiblePerson)
  }
  await updateCompany(stripeAccount.stripeAccountId, { executives_provided: true })
  await updateConnectorStripeProgress(service, account, 'responsible_person')
  logger.info('Responsible person details submitted for Stripe account', {
    stripe_account_id: stripeAccount.stripeAccountId
  })
}

/**
 * Updates Stripe account director for the given service and account type
 * @param {GatewayAccount} account
 * @param {GOVUKPayService} service
 * @param {StripeDirectorParams} director
 */
const updateStripeDetailsDirector = async (service, account, director) => {
  const stripeAccount = await connector.getStripeAccountByServiceIdAndAccountType(service.externalId, account.type)
  const stripePersonsResponse = await listPersons(stripeAccount.stripeAccountId)
  const possiblyExistingDirector = stripePersonsResponse.data.filter(person => person.relationship && person.relationship.director).pop()
  if (possiblyExistingDirector !== undefined) {
    await updateDirector(stripeAccount.stripeAccountId, possiblyExistingDirector.id, director)
  } else {
    await createDirector(stripeAccount.stripeAccountId, director)
  }
  await updateCompany(stripeAccount.stripeAccountId, { directors_provided: true })
  await updateConnectorStripeProgress(service, account, 'director')
  logger.info('Director details submitted for Stripe account', {
    stripe_account_id: stripeAccount.stripeAccountId
  })
}

/**
 * Updates Stripe account Company number for the given service and account type
 * @param {GatewayAccount} account
 * @param {GOVUKPayService} service
 * @param {string|boolean} companyNumber
 */
const updateStripeDetailsCompanyNumber = async (service, account, companyNumber) => {
  const stripeAccount = await connector.getStripeAccountByServiceIdAndAccountType(service.externalId, account.type)
  if (companyNumber) {
    await updateCompany(stripeAccount.stripeAccountId, { tax_id: companyNumber })
    logger.info('Company number submitted for Stripe account', {
      stripe_account_id: stripeAccount.stripeAccountId
    })
  } else {
    logger.info('Company number omitted for Stripe account', {
      stripe_account_id: stripeAccount.stripeAccountId
    })
  }
  await updateConnectorStripeProgress(service, account, 'company_number')
}

/**
 * Updates Stripe account VAT number for the given service and account type
 * @param {GatewayAccount} account
 * @param {GOVUKPayService} service
 * @param {string|boolean} vatNumber
 */
const updateStripeDetailsVatNumber = async (service, account, vatNumber) => {
  const stripeAccount = await connector.getStripeAccountByServiceIdAndAccountType(service.externalId, account.type)
  if (vatNumber) {
    await updateCompany(stripeAccount.stripeAccountId, { vat_id: vatNumber })
    logger.info('VAT number submitted for Stripe account', {
      stripe_account_id: stripeAccount.stripeAccountId
    })
  } else {
    logger.info('VAT number omitted for Stripe account', {
      stripe_account_id: stripeAccount.stripeAccountId
    })
  }
  await updateConnectorStripeProgress(service, account, 'vat_number')
}

/**
 * @typedef {{
 *   fieldname: string,
 *   originalname: string,
 *   encoding: string,
 *   mimetype: string,
 *   size: number,
 *   destination: string,
 *   filename: string,
 *   path: string,
 *   buffer: Buffer
 * }} MulterFile
 */

/**
 * Uploads Stripe account entity document for the given service and account type
 * @param {GatewayAccount} account
 * @param {GOVUKPayService} service
 * @param {MulterFile} file
 */
const updateStripeDetailsUploadEntityDocument = async (service, account, file) => {
  const stripeAccount = await connector.getStripeAccountByServiceIdAndAccountType(service.externalId, account.type)
  const stripeFile = await uploadFile(`entity_document_for_account_${account.id}`, file.mimetype, file.buffer)
  await updateAccount(stripeAccount.stripeAccountId, { entity_verification_document_id: stripeFile.id })
  await updateConnectorStripeProgress(service, account, 'government_entity_document')
  logger.info('Government entity document uploaded for Stripe account', {
    stripe_account_id: stripeAccount.stripeAccountId
  })
}

/**
 * Updates Stripe set up progress in connector for given service and account type
 * @param {GOVUKPayService} service
 * @param {GatewayAccount} account
 * @param {string} flag
 */
const updateConnectorStripeProgress = async (service, account, flag) => {
  await connector.setStripeAccountSetupFlagByServiceIdAndAccountType(service.externalId, account.type, flag)
}

const getStripeAccountOnboardingDetails = async (service, account) => {
  const stripeAccount = await connector.getStripeAccountByServiceIdAndAccountType(service.externalId, account.type)

  try {
    const connectAccount = await retrieveAccountDetails(stripeAccount.stripeAccountId)
    const persons = await listPersons(stripeAccount.stripeAccountId)
    const bankAccount = await listBankAccount(
      stripeAccount.stripeAccountId,
      { object: 'bank_account', limit: 1 }
    )

    const responsiblePerson = persons.data.find(person => person.relationship?.representative)
    const director = persons.data.find(person => person.relationship?.director)

    return {
      company: {
        vatNumber: connectAccount.company?.vat_id_provided ? 'Provided' : 'Not provided',
        companyNumber: connectAccount.company?.tax_id_provided ? 'Provided' : 'Not provided',
        entityDocument: connectAccount.company?.verification?.document ? 'Uploaded' : 'Not found'
      },
      bankAccount: {
        sortCode: bankAccount.data[0]?.routing_number,
        accountNumber: bankAccount.data[0]?.last4
          ? `●●●●${bankAccount.data[0].last4}`
          : ''
      },
      responsiblePerson: responsiblePerson ? `${responsiblePerson.first_name} ${responsiblePerson.last_name}` : '',
      director: director ? `${director.first_name} ${director.last_name}` : ''
    }
  } catch (error) {
    logger.error(error.message)
    throw new Error(`Problem fetching account details from Stripe [stripe_account_id: ${stripeAccount.stripeAccountId}]`)
  }
}

module.exports = {
  updateStripeDetailsBankAccount,
  updateStripeDetailsResponsiblePerson,
  updateStripeDetailsDirector,
  updateStripeDetailsCompanyNumber,
  updateStripeDetailsVatNumber,
  updateStripeDetailsUploadEntityDocument,
  updateConnectorStripeProgress,
  getStripeAccountOnboardingDetails
}
