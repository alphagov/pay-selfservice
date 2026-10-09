import { GatewayAccountCredentialUpdateRequest } from '@models/gateway-account-credential/GatewayAccountCredentialUpdateRequest.class'
import ConnectorClient from '@services/clients/pay/ConnectorClient.class'
import { createLegalEntity, createTransferInstrument } from '@services/clients/adyen/adyen-legal-entity-management.client'
import { OrganisationDetailsSession } from '@controllers/simplified-account/settings/adyen-details/organisation-details/constants'
import { Types } from '@adyen/api-library'
import { CreateBankDetailsBody } from '@controllers/simplified-account/settings/adyen-details/bank-details.controller'
import { BankAccountAccountIdentification } from '@adyen/api-library/lib/src/typings/balancePlatform/bankAccountAccountIdentification'
import { UKLocalAccountIdentification } from '@adyen/api-library/lib/src/typings/balancePlatform/uKLocalAccountIdentification'
import { TransferInstrumentInfo } from '@adyen/api-library/lib/src/typings/legalEntityManagement/transferInstrumentInfo'
import { BankAccountInfo } from '@adyen/api-library/lib/src/typings/legalEntityManagement/bankAccountInfo'
import createLogger from '@utils/logger'

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

const createBankDetails = async (details: CreateBankDetailsBody, serviceExternalId: string, accountType: string, switchingCredentialId: string) => {
  const accountIdentification: BankAccountAccountIdentification = {
    sortCode: details.sortCode,
    accountNumber: details.accountNumber,
    type: UKLocalAccountIdentification.TypeEnum.UkLocal
  }

  const bankAccount: BankAccountInfo = {
    accountIdentification
  }

  const gatewayAccount = await connectorClient.gatewayAccounts.getByServiceExternalIdAndAccountType(serviceExternalId, accountType)
  const adyenCredential = gatewayAccount.gatewayAccountCredentials.find(credential => credential.externalId === switchingCredentialId)
  const legalEntityId = adyenCredential!.credentials.legalEntityId!

  const transferInstrumentInfo: TransferInstrumentInfo = {
    // legalEntityId,
    legalEntityId: '',
    type: TransferInstrumentInfo.TypeEnum.BankAccount,
    bankAccount
  }

  const transferInstrument = await createTransferInstrument(transferInstrumentInfo)

  logger.info(`Transfer instrument ${transferInstrument.id} created for legal entity`, {
    legal_entity_id: legalEntityId,
  })

  return

}

export { setAdyenLegalEntityId, setAdyenStoreId, setAdyenAccountHolderId, setAdyenBalanceAccountId, createOrganisation, createBankDetails }

