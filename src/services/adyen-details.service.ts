import { GatewayAccountCredentialUpdateRequest } from '@models/gateway-account-credential/GatewayAccountCredentialUpdateRequest.class'
import ConnectorClient from '@services/clients/pay/ConnectorClient.class'
import {
  createLegalEntity,
  getLegalEntity,
  updateLegalEntity,
} from '@services/clients/adyen/adyen-legal-entity-management.client'
import { OrganisationDetailsSession } from '@controllers/simplified-account/settings/adyen-details/organisation-details/constants'
import { Types } from '@adyen/api-library'
import { ResponsiblePersonSession } from '@controllers/simplified-account/settings/adyen-details/responsible-person/constants'
import { Individual } from '@adyen/api-library/lib/src/typings/legalEntityManagement/individual'

type LegalEntityInfoRequiredType = Types.legalEntityManagement.LegalEntityInfoRequiredType
type Organization = Types.legalEntityManagement.Organization

const connectorClient = new ConnectorClient()

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
}
