import ConnectorClient from '@services/clients/pay/ConnectorClient.class'
import stripeClient from '@services/clients/stripe/stripe.client'
import { ServiceUpdateRequest } from '@models/service/ServiceUpdateRequest.class'
import { updateService } from '@services/service.service'
import { STRIPE } from '@models/constants/payment-providers'
import createLogger from '@utils/logger'
import GatewayAccount from '@models/gateway-account/GatewayAccount.class'
import Service from '@models/service/Service.class'
import { StripePersonParams } from '@services/clients/stripe/StripePerson.class'
import { StripeDirectorParams } from '@services/clients/stripe/StripeDirector.class'
import { StripeOrganisationDetailsParams } from '@services/clients/stripe/StripeOrganisationDetails.class'
import { InvalidConfigurationError } from '@root/errors'

const logger = createLogger(__filename)
const connectorClient = new ConnectorClient()

const getConnectorStripeAccountSetup = async (serviceExternalId: string, accountType: string) => {
  return connectorClient.gatewayAccounts.getStripeAccountSetupByServiceExternalIdAndAccountType(
    serviceExternalId,
    accountType
  )
}

const updateConnectorStripeProgress = async (service: Service, gatewayAccount: GatewayAccount, step: string) => {
  await connectorClient.gatewayAccounts.updateStripeAccountSetupByServiceExternalIdAndAccountType(
    service.externalId,
    gatewayAccount.type,
    step
  )
}

const updateStripeDetailsBankDetails = async (
  service: Service,
  gatewayAccount: GatewayAccount,
  sortCode: string,
  accountNumber: string
) => {
  const stripeAccountId = getStripeAccountIdForGatewayAccount(gatewayAccount)
  await stripeClient.updateBankAccount(stripeAccountId, {
    bank_account_sort_code: sortCode,
    bank_account_number: accountNumber,
  })
  await updateConnectorStripeProgress(service, gatewayAccount, 'bank_account')
  logger.info('Bank account details submitted for Stripe account', {
    stripe_account_id: stripeAccountId,
  })
}

const updateStripeDetailsResponsiblePerson = async (
  service: Service,
  gatewayAccount: GatewayAccount,
  responsiblePerson: StripePersonParams
) => {
  const stripeAccountId = getStripeAccountIdForGatewayAccount(gatewayAccount)
  const stripePersonsResponse = await stripeClient.listPersons(stripeAccountId)
  const possiblyExistingResponsiblePerson = stripePersonsResponse.data
    .filter((person) => person.relationship?.representative)
    .pop()
  if (possiblyExistingResponsiblePerson !== undefined) {
    await stripeClient.updatePerson(stripeAccountId, possiblyExistingResponsiblePerson.id, responsiblePerson)
  } else {
    await stripeClient.createPerson(stripeAccountId, responsiblePerson)
  }
  await stripeClient.updateCompany(stripeAccountId, { executives_provided: true })
  await updateConnectorStripeProgress(service, gatewayAccount, 'responsible_person')
  logger.info('Responsible person details submitted for Stripe account', {
    stripe_account_id: stripeAccountId,
  })
}

const updateStripeDetailsDirector = async (
  service: Service,
  gatewayAccount: GatewayAccount,
  director: StripeDirectorParams
) => {
  const stripeAccountId = getStripeAccountIdForGatewayAccount(gatewayAccount)
  const stripePersonsResponse = await stripeClient.listPersons(stripeAccountId)
  const possiblyExistingDirector = stripePersonsResponse.data.filter((person) => person.relationship?.director).pop()
  if (possiblyExistingDirector !== undefined) {
    await stripeClient.updateDirector(stripeAccountId, possiblyExistingDirector.id, director)
  } else {
    await stripeClient.createDirector(stripeAccountId, director)
  }
  await stripeClient.updateCompany(stripeAccountId, { directors_provided: true })
  await updateConnectorStripeProgress(service, gatewayAccount, 'director')
  logger.info('Director details submitted for Stripe account', {
    stripe_account_id: stripeAccountId,
  })
}

const updateStripeDetailsCompanyNumber = async (
  service: Service,
  gatewayAccount: GatewayAccount,
  companyNumber: string
) => {
  const stripeAccountId = getStripeAccountIdForGatewayAccount(gatewayAccount)
  if (companyNumber) {
    await stripeClient.updateCompany(stripeAccountId, { tax_id: companyNumber })
    logger.info('Company number submitted for Stripe account', {
      stripe_account_id: stripeAccountId,
    })
  } else {
    logger.info('Company number omitted for Stripe account', {
      stripe_account_id: stripeAccountId,
    })
  }
  await updateConnectorStripeProgress(service, gatewayAccount, 'company_number')
}

const updateStripeDetailsVatNumber = async (service: Service, gatewayAccount: GatewayAccount, vatNumber: string) => {
  const stripeAccountId = getStripeAccountIdForGatewayAccount(gatewayAccount)
  if (vatNumber) {
    await stripeClient.updateCompany(stripeAccountId, { vat_id: vatNumber })
    logger.info('VAT number submitted for Stripe account', {
      stripe_account_id: stripeAccountId,
    })
  } else {
    logger.info('VAT number omitted for Stripe account', {
      stripe_account_id: stripeAccountId,
    })
  }
  await updateConnectorStripeProgress(service, gatewayAccount, 'vat_number')
}

const updateStripeDetailsUploadEntityDocument = async (
  service: Service,
  gatewayAccount: GatewayAccount,
  file: Express.Multer.File
) => {
  const stripeAccountId = getStripeAccountIdForGatewayAccount(gatewayAccount)
  const stripeFile = await stripeClient.uploadFile(
    `entity_document_for_account_${gatewayAccount.id}`,
    file.mimetype,
    file.buffer
  )
  await stripeClient.updateAccount(stripeAccountId, { entity_verification_document_id: stripeFile.id })
  await updateConnectorStripeProgress(service, gatewayAccount, 'government_entity_document')
  logger.info('Government entity document uploaded for Stripe account', {
    stripe_account_id: stripeAccountId,
  })
}

const updateStripeDetailsOrganisationNameAndAddress = async (
  service: Service,
  gatewayAccount: GatewayAccount,
  newOrgDetails: StripeOrganisationDetailsParams
) => {
  const stripeAccountId = getStripeAccountIdForGatewayAccount(gatewayAccount)
  await stripeClient.updateOrganisationDetails(stripeAccountId, newOrgDetails)
  await updateConnectorStripeProgress(service, gatewayAccount, 'organisation_details')
  logger.info('Organisation details updated for Stripe account', {
    stripe_account_id: stripeAccountId,
  })
  const serviceUpdateRequest = new ServiceUpdateRequest()
    .replace()
    .merchantDetails.name(newOrgDetails.name)
    .replace()
    .merchantDetails.addressLine1(newOrgDetails.address_line1)
    .replace()
    .merchantDetails.addressLine2(newOrgDetails.address_line2 ?? '')
    .replace()
    .merchantDetails.addressCity(newOrgDetails.address_city)
    .replace()
    .merchantDetails.addressPostcode(newOrgDetails.address_postcode)
    .replace()
    .merchantDetails.addressCountry(newOrgDetails.address_country)
    .formatPayload()
  await updateService(service.externalId, serviceUpdateRequest)
  logger.info('Organisation details updated for service', {
    service_external_id: service.externalId,
  })
}

const getStripeAccountOnboardingDetails = async (_service: Service, gatewayAccount: GatewayAccount) => {
  const stripeAccountId = getStripeAccountIdForGatewayAccount(gatewayAccount)

  try {
    const connectAccount = await stripeClient.retrieveAccountDetails(stripeAccountId)
    const persons = await stripeClient.listPersons(stripeAccountId)
    const bankAccount = await stripeClient.listBankAccount(stripeAccountId)

    const responsiblePerson = persons.data.find((person) => person.relationship?.representative)
    const director = persons.data.find((person) => person.relationship?.director)

    return {
      bankAccount: {
        title: 'Organisation bank details',
        rows: {
          'Sort code': bankAccount.data[0]?.routing_number,
          'Account number': bankAccount.data[0]?.last4 ? `●●●●${bankAccount.data[0].last4}` : '',
        },
      },
      contact: {
        title: 'Organisation contact',
        rows: {
          'Responsible person': responsiblePerson
            ? `${responsiblePerson.first_name} ${responsiblePerson.last_name}`
            : '',
          'Service director': director ? `${director.first_name} ${director.last_name}` : '',
        },
      },
      company: {
        title: 'Company registration details',
        rows: {
          'VAT registration number': connectAccount.company?.vat_id_provided ? 'Provided' : 'Not provided',
          'Company registration number': connectAccount.company?.tax_id_provided ? 'Provided' : 'Not provided',
          'Government entity document': connectAccount.company?.verification?.document ? 'Provided' : 'Not provided',
        },
      },
    }
  } catch (err) {
    logger.error(err)
    throw new Error(`Problem fetching account details from Stripe [stripe_account_id: ${stripeAccountId}]`)
  }
}

const getStripeAccountCapabilities = async (gatewayAccount: GatewayAccount) => {
  const stripeAccountId = getStripeAccountIdForGatewayAccount(gatewayAccount)

  try {
    const connectAccount = await stripeClient.retrieveAccountDetails(stripeAccountId)
    return {
      chargesEnabled: connectAccount.charges_enabled,
      hasLegacyPaymentsCapability: connectAccount.capabilities?.legacy_payments,
    }
  } catch (err) {
    logger.error(err)
  }

  return undefined
}

function getStripeAccountIdForGatewayAccount(gatewayAccount: GatewayAccount) {
  let stripeAccountId
  if (gatewayAccount.isSwitchingToProvider(STRIPE)) {
    stripeAccountId = gatewayAccount.getSwitchingCredential().credentials.stripeAccountId
  } else {
    stripeAccountId = gatewayAccount.getCurrentCredential()?.credentials.stripeAccountId
  }
  if (!stripeAccountId) {
    throw new InvalidConfigurationError(
      'No Stripe Account Id present in either current or switching gateway credential, Stripe Account Id is required'
    )
  } else {
    return stripeAccountId
  }
}

export {
  updateStripeDetailsBankDetails,
  updateStripeDetailsResponsiblePerson,
  updateStripeDetailsDirector,
  updateStripeDetailsCompanyNumber,
  updateStripeDetailsVatNumber,
  updateStripeDetailsUploadEntityDocument,
  updateStripeDetailsOrganisationNameAndAddress,
  updateConnectorStripeProgress,
  getStripeAccountOnboardingDetails,
  getStripeAccountCapabilities,
  getStripeAccountIdForGatewayAccount,
  getConnectorStripeAccountSetup,
}
