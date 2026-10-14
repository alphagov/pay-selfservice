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
  createTransferInstrument
} from '@services/clients/adyen/adyen-legal-entity-management.client'

import { ResponsiblePersonSession } from '@controllers/simplified-account/settings/adyen-details/responsible-person/constants'
import { Individual } from '@adyen/api-library/lib/src/typings/legalEntityManagement/individual'

type LegalEntityInfoRequiredType = Types.legalEntityManagement.LegalEntityInfoRequiredType
type Organization = Types.legalEntityManagement.Organization

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

const createOrganisation = async (session: OrganisationDetailsSession) => {
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

  return createLegalEntity(legalEntityInfo)
}

const getLegalEntityId = async (serviceExternalId: string, accountType: string, switchingCredentialId: string) => {
  const gatewayAccount = await connectorClient.gatewayAccounts.getByServiceExternalIdAndAccountType(serviceExternalId, accountType)
  const adyenCredential = gatewayAccount.gatewayAccountCredentials.find(credential => credential.externalId === switchingCredentialId)
  const legalEntityId = adyenCredential!.credentials.legalEntityId!
  return legalEntityId
}

const createBankDetails = async (details: CreateBankDetailsBody, serviceExternalId: string, accountType: string, switchingCredentialId: string) => {
  const legalEntityId = await getLegalEntityId(serviceExternalId, accountType, switchingCredentialId)

  const accountIdentification: BankAccountAccountIdentification = {
    sortCode: details.sortCode,
    accountNumber: details.accountNumber,
    type: UKLocalAccountIdentification.TypeEnum.UkLocal
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

const toUkInternationalNumber = (input: string): string => {
  const cleaned = input.replace(/[\s().-]/g, '')
  return cleaned.startsWith('+') ? cleaned : `+44${cleaned.replace(/^0/, '')}`
}

export {
  setAdyenLegalEntityId,
  setAdyenStoreId,
  setAdyenAccountHolderId,
  setAdyenBalanceAccountId,
  createOrganisation,
  createResponsiblePerson,
  createBankDetails
}
