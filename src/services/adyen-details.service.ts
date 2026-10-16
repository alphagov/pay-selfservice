import { GatewayAccountCredentialUpdateRequest } from '@models/gateway-account-credential/GatewayAccountCredentialUpdateRequest.class'
import ConnectorClient from '@services/clients/pay/ConnectorClient.class'
import { OrganisationDetailsSession } from '@controllers/simplified-account/settings/adyen-details/organisation-details/constants'
import { Types } from '@adyen/api-library'
import { CreateBankDetailsBody } from '@controllers/simplified-account/settings/adyen-details/bank-details.controller'
import { BankAccountAccountIdentification } from '@adyen/api-library/lib/src/typings/balancePlatform/bankAccountAccountIdentification'
import { UKLocalAccountIdentification } from '@adyen/api-library/lib/src/typings/balancePlatform/uKLocalAccountIdentification'
import { TransferInstrumentInfo } from '@adyen/api-library/lib/src/typings/legalEntityManagement/transferInstrumentInfo'
import createLogger from '@utils/logger'
import {
  createLegalEntity,
  getLegalEntity,
  updateLegalEntity,
  createTransferInstrument,
} from '@services/clients/adyen/adyen-legal-entity-management.client'
import {
  createAccountHolder as createAdyenAccountHolder,
  createBalanceAccount as createAdyenBalanceAccount,
} from '@services/clients/adyen/adyen-balance-platform.client'
import { ServiceDirectorSession } from '@controllers/simplified-account/settings/adyen-details/service-director/constants'
import { ResponsiblePersonSession } from '@controllers/simplified-account/settings/adyen-details/responsible-person/constants'
import { Individual } from '@adyen/api-library/lib/src/typings/legalEntityManagement/individual'

type LegalEntityInfoRequiredType = Types.legalEntityManagement.LegalEntityInfoRequiredType
type Organization = Types.legalEntityManagement.Organization
type AccountHolderInfo = Types.balancePlatform.AccountHolderInfo
type BalanceAccountInfo = Types.balancePlatform.BalanceAccountInfo

const connectorClient = new ConnectorClient()
const logger = createLogger(__filename)

const setAdyenLegalEntityId = async (
  serviceExternalId: string,
  accountType: string,
  credentialExternalId: string,
  userExternalId: string,
  legalEntityId: string
) => {
  return connectorClient.gatewayAccounts.patchCredentialsByServiceExternalIdAndAccountType(
    serviceExternalId,
    accountType,
    credentialExternalId,
    new GatewayAccountCredentialUpdateRequest(userExternalId).replace().credentials().legalEntityId(legalEntityId)
  )
}

const setAdyenStoreId = async (
  serviceExternalId: string,
  accountType: string,
  credentialExternalId: string,
  userExternalId: string,
  storeId: string
) => {
  return connectorClient.gatewayAccounts.patchCredentialsByServiceExternalIdAndAccountType(
    serviceExternalId,
    accountType,
    credentialExternalId,
    new GatewayAccountCredentialUpdateRequest(userExternalId).replace().credentials().storeId(storeId)
  )
}

const setAdyenAccountHolderId = async (
  serviceExternalId: string,
  accountType: string,
  credentialExternalId: string,
  userExternalId: string,
  accountHolderId: string
) => {
  return connectorClient.gatewayAccounts.patchCredentialsByServiceExternalIdAndAccountType(
    serviceExternalId,
    accountType,
    credentialExternalId,
    new GatewayAccountCredentialUpdateRequest(userExternalId).replace().credentials().accountHolderId(accountHolderId)
  )
}

const setAdyenBalanceAccountId = async (
  serviceExternalId: string,
  accountType: string,
  credentialExternalId: string,
  userExternalId: string,
  balanceAccountId: string
) => {
  return connectorClient.gatewayAccounts.patchCredentialsByServiceExternalIdAndAccountType(
    serviceExternalId,
    accountType,
    credentialExternalId,
    new GatewayAccountCredentialUpdateRequest(userExternalId).replace().credentials().balanceAccountId(balanceAccountId)
  )
}

const createOrganisation = async (session: OrganisationDetailsSession, serviceName: string) => {
  const organization: Organization = {
    legalName: session.organisationName ?? '',
    registeredAddress: {
      street: session.addressLine1,
      street2: session.addressLine2,
      city: session.addressCity,
      postalCode: session.addressPostcode,
      country: session.addressCountry ?? '',
    },
    registrationNumber: session.companyRegistrationNumber,
    vatNumber: session.vatRegistrationNumber,
  }

  const legalEntityInfo: LegalEntityInfoRequiredType = {
    type: Types.legalEntityManagement.LegalEntityInfoRequiredType.TypeEnum.Organization,
    organization,
  }
  const legalEntity = await createLegalEntity(legalEntityInfo)
  const accountHolder = await createAccountHolder(legalEntity.id, serviceName)
  const balanceAccount = await createBalanceAccount(accountHolder.id, serviceName)

  return { legalEntity, accountHolder, balanceAccount }
}

const getLegalEntityId = async (serviceExternalId: string, accountType: string, switchingCredentialId: string) => {
  const gatewayAccount = await connectorClient.gatewayAccounts.getByServiceExternalIdAndAccountType(
    serviceExternalId,
    accountType
  )
  const adyenCredential = gatewayAccount.gatewayAccountCredentials.find(
    (credential) => credential.externalId === switchingCredentialId
  )
  const legalEntityId = adyenCredential!.credentials.legalEntityId!
  return legalEntityId
}

const createBankDetails = async (
  details: CreateBankDetailsBody,
  serviceExternalId: string,
  accountType: string,
  switchingCredentialId: string
) => {
  const legalEntityId = await getLegalEntityId(serviceExternalId, accountType, switchingCredentialId)

  const accountIdentification: BankAccountAccountIdentification = {
    sortCode: details.sortCode,
    accountNumber: details.accountNumber,
    type: UKLocalAccountIdentification.TypeEnum.UkLocal,
  }

  const transferInstrumentInfo: TransferInstrumentInfo = {
    legalEntityId,
    type: TransferInstrumentInfo.TypeEnum.BankAccount,
    bankAccount: {
      accountIdentification,
    },
  }

  await createTransferInstrument(transferInstrumentInfo)

  logger.info(`Transfer instrument created for legal entity`, {
    legal_entity_id: legalEntityId,
  })

  return
}

const createResponsiblePerson = async (session: ResponsiblePersonSession, organisationLegalEntityId: string) => {
  const individual: Individual = {
    name: {
      firstName: session.firstName ?? '',
      lastName: session.lastName ?? '',
    },
    birthData: {
      dateOfBirth: `${session.dobYear}-${session.dobMonth}-${session.dobDay}`,
    },
    residentialAddress: {
      street: session.addressLine1,
      street2: session.addressLine2,
      city: session.addressCity,
      postalCode: session.addressPostcode,
      country: session.addressCountry ?? 'GB',
    },
    email: session.email,
    phone: {
      number: toUkInternationalNumber(session.telephoneNumber ?? ''),
      phoneCountryCode: session.numberCountryCode ?? 'GB',
    },
  }

  const individualLegalEntityInfo: LegalEntityInfoRequiredType = {
    type: Types.legalEntityManagement.LegalEntityInfoRequiredType.TypeEnum.Individual,
    individual,
  }

  const responsiblePerson = await createLegalEntity(individualLegalEntityInfo)

  const organisation = await getLegalEntity(organisationLegalEntityId)

  const existingAssociations = organisation.entityAssociations ?? []

  const entityAssociationsPayload = {
    entityAssociations: [
      ...existingAssociations,
      {
        legalEntityId: responsiblePerson.id,
        jobTitle: 'Responsible Person',
        type: Types.legalEntityManagement.LegalEntityAssociation.TypeEnum.Signatory,
      },
    ],
  }

  await updateLegalEntity(organisationLegalEntityId, entityAssociationsPayload)

  return responsiblePerson
}

const createAccountHolder = async (organisationLegalEntityId: string, serviceName: string) => {
  const balancePlatformId = process.env.ADYEN_BALANCE_PLATFORM_ID
  if (!balancePlatformId) {
    throw new Error('ADYEN_BALANCE_PLATFORM_ID is not set')
  }

  const accountHolderInfo: AccountHolderInfo = {
    legalEntityId: organisationLegalEntityId,
    balancePlatform: balancePlatformId,
    description: serviceName,
  }

  return createAdyenAccountHolder(accountHolderInfo)
}

const createBalanceAccount = async (accountHolderId: string, serviceName: string) => {
  const balanceAccountInfo: BalanceAccountInfo = {
    accountHolderId,
    defaultCurrencyCode: 'GBP',
    description: serviceName,
  }

  return createAdyenBalanceAccount(balanceAccountInfo)
}

const toUkInternationalNumber = (input: string): string => {
  const cleaned = input.replace(/[\s().-]/g, '')
  return cleaned.startsWith('+') ? cleaned : `+44${cleaned.replace(/^0/, '')}`
}

const createServiceDirector = async (
  serviceDirectorSession: ServiceDirectorSession,
  organisationLegalEntityId: string
) => {
  let organisationLegalEntity
  try {
    organisationLegalEntity = await getLegalEntity(organisationLegalEntityId)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(`Organisation legal entity with ID ${organisationLegalEntityId} not found: ${errorMessage}`)
  }

  if (!serviceDirectorSession.firstName || !serviceDirectorSession.lastName) {
    throw new Error('Service director first name and last name are required')
  }

  const serviceDirectorLegalEntity: LegalEntityInfoRequiredType = {
    type: Types.legalEntityManagement.LegalEntityInfoRequiredType.TypeEnum.Individual,
    individual: {
      birthData: {
        // Expected format yyyy-MM-dd
        dateOfBirth: `${serviceDirectorSession.dobYear}-${serviceDirectorSession.dobMonth?.padStart(2, '0')}-${serviceDirectorSession.dobDay?.padStart(2, '0')}`,
      },
      email: serviceDirectorSession.email,
      name: {
        firstName: serviceDirectorSession.firstName,
        lastName: serviceDirectorSession.lastName,
      },
      residentialAddress: {
        street: serviceDirectorSession.addressLine1,
        ...(serviceDirectorSession.addressLine2 ? { street2: serviceDirectorSession.addressLine2 } : {}),
        city: serviceDirectorSession.addressCity,
        // Allowed formats: L(L)N(O)NLL or L(L)N(O) NLL
        postalCode: serviceDirectorSession.addressPostcode?.toUpperCase().replaceAll(/\s/g, ''),
        country: 'GB',
      },
    },
  }

  let serviceDirector
  try {
    serviceDirector = await createLegalEntity(serviceDirectorLegalEntity)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(`Service director legal entity creation failed: ${errorMessage}`)
  }

  const currentAssociations = organisationLegalEntity.entityAssociations ?? []

  // update the organisation with the person
  try {
    await updateLegalEntity(organisationLegalEntityId, {
      entityAssociations: [
        ...currentAssociations,
        {
          legalEntityId: serviceDirector.id,
          type: Types.legalEntityManagement.LegalEntityAssociation.TypeEnum.Director,
        },
      ],
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(
      `Couldn't link director (${serviceDirector.id}) to organisation (${organisationLegalEntityId}): ${errorMessage}`
    )
  }

  return serviceDirector
}

export {
  setAdyenLegalEntityId,
  setAdyenStoreId,
  setAdyenAccountHolderId,
  setAdyenBalanceAccountId,
  createOrganisation,
  createResponsiblePerson,
  createBankDetails,
  createServiceDirector,
  createAccountHolder,
  createBalanceAccount,
}
