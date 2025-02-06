const { ConnectorClient } = require('./clients/connector.client')
const {
  updateDirector, createDirector, updateBankAccount,
  listPersons, updatePerson, createPerson,
  updateCompany, uploadFile, updateAccount, retrieveAccountDetails,
  listBankAccount, updateOrganisationDetails
} = require('@services/clients/stripe/stripe.client')
const { ServiceUpdateRequest } = require('@models/ServiceUpdateRequest.class')
const { updateService } = require('@services/service.service')
const logger = require('@utils/logger')(__filename)
const connector = new ConnectorClient(process.env.CONNECTOR_URL)

/**
 * @param {string} serviceExternalId
 * @param {string} accountType
 * @returns {Promise<StripeAccountSetup>}
 */
const getConnectorStripeAccountSetup = async (serviceExternalId, accountType) => {
  return connector.getStripeAccountSetupByServiceExternalIdAndAccountType(serviceExternalId, accountType)
}

/**
 * Updates Stripe account bank details for the given service and account type
 * @param {GatewayAccount} account
 * @param {GOVUKPayService} service
 * @param {string} sortCode
 * @param {string} accountNumber
 */
const updateStripeDetailsBankDetails = async (service, account, sortCode, accountNumber) => {
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
 * Updates Stripe account organisation name and address for the given service and account type
 * @param {GatewayAccount} account
 * @param {GOVUKPayService} service
 * @param {StripeOrganisationDetailsParams} newOrgDetails
 */
const updateStripeDetailsOrganisationNameAndAddress = async (service, account, newOrgDetails) => {
  const stripeAccount = await connector.getStripeAccountByServiceIdAndAccountType(service.externalId, account.type)
  await updateOrganisationDetails(stripeAccount.stripeAccountId, newOrgDetails)
  await updateConnectorStripeProgress(service, account, 'organisation_details')
  logger.info('Organisation details updated for Stripe account', {
    stripe_account_id: stripeAccount.stripeAccountId
  })
  const serviceUpdateRequest = new ServiceUpdateRequest()
    .replace().merchantDetails.name(newOrgDetails.name)
    .replace().merchantDetails.addressLine1(newOrgDetails.address_line1)
    .replace().merchantDetails.addressLine2(newOrgDetails.address_line2 ?? '')
    .replace().merchantDetails.addressCity(newOrgDetails.address_city)
    .replace().merchantDetails.addressPostcode(newOrgDetails.address_postcode)
    .replace().merchantDetails.addressCountry(newOrgDetails.address_country)
    .formatPayload()
  await updateService(service.externalId, serviceUpdateRequest)
  logger.info('Organisation details updated for service', {
    service_external_id: service.externalId
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
      bankAccount: {
        title: 'Organisation bank details',
        rows: {
          'Sort code': bankAccount.data[0]?.routing_number,
          'Account number': bankAccount.data[0]?.last4
            ? `●●●●${bankAccount.data[0].last4}`
            : ''
        }
      },
      contact: {
        title: 'Organisation contact',
        rows: {
          'Responsible person': responsiblePerson ? `${responsiblePerson.first_name} ${responsiblePerson.last_name}` : '',
          'Service director': director ? `${director.first_name} ${director.last_name}` : ''
        }
      },
      company: {
        title: 'Company registration details',
        rows: {
          'VAT registration number': connectAccount.company?.vat_id_provided ? 'Provided' : 'Not provided',
          'Company registration number': connectAccount.company?.tax_id_provided ? 'Provided' : 'Not provided',
          'Government entity document': connectAccount.company?.verification?.document ? 'Provided' : 'Not provided'
        }
      }
    }
  } catch (error) {
    logger.error(error.message)
    throw new Error(`Problem fetching account details from Stripe [stripe_account_id: ${stripeAccount.stripeAccountId}]`)
  }
}

module.exports = {
  updateStripeDetailsBankDetails,
  updateStripeDetailsResponsiblePerson,
  updateStripeDetailsDirector,
  updateStripeDetailsCompanyNumber,
  updateStripeDetailsVatNumber,
  updateStripeDetailsUploadEntityDocument,
  updateStripeDetailsOrganisationNameAndAddress,
  updateConnectorStripeProgress,
  getStripeAccountOnboardingDetails,
  getConnectorStripeAccountSetup
}
