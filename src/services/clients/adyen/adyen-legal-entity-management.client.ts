import { Client, EnvironmentEnum, LegalEntityManagementAPI, Types } from '@adyen/api-library'
import { TransferInstrumentInfo } from '@adyen/api-library/lib/src/typings/legalEntityManagement/transferInstrumentInfo'
import { AdyenMockServerHttpClient } from '@services/clients/adyen/adyen-mock-server-http-client'
import { AdyenAPI, AdyenRequest } from '@services/clients/adyen/adyen-request-wrapper'

const ADYEN_LEGAL_ENTITY_MANAGEMENT_API_KEY = process.env.ADYEN_LEGAL_ENTITY_MANAGEMENT_API_KEY
const ADYEN_ENVIRONMENT = process.env.ADYEN_ENVIRONMENT === 'LIVE' ? EnvironmentEnum.LIVE : EnvironmentEnum.TEST
const ADYEN_MOCK_SERVER_URL = process.env.ADYEN_MOCK_SERVER_URL

type LegalEntity = Types.legalEntityManagement.LegalEntity
type LegalEntityInfo = Types.legalEntityManagement.LegalEntityInfo
type LegalEntityInfoRequiredType = Types.legalEntityManagement.LegalEntityInfoRequiredType

const client = new Client(
  { apiKey: ADYEN_LEGAL_ENTITY_MANAGEMENT_API_KEY, environment: ADYEN_ENVIRONMENT },
  ADYEN_MOCK_SERVER_URL ? new AdyenMockServerHttpClient(ADYEN_MOCK_SERVER_URL) : undefined
)

const legalEntityManagementAPI = new LegalEntityManagementAPI(client)

export async function createLegalEntity(legalEntityInfo: LegalEntityInfoRequiredType): Promise<LegalEntity> {
  return new AdyenRequest(AdyenAPI.LEGAL_ENTITY_MANAGEMENT, 'create legal entity').execute(() =>
    legalEntityManagementAPI.LegalEntitiesApi.createLegalEntity(legalEntityInfo)
  )
}

export async function getLegalEntity(legalEntityId: string): Promise<LegalEntity> {
  return new AdyenRequest(AdyenAPI.LEGAL_ENTITY_MANAGEMENT, 'get legal entity').execute(() =>
    legalEntityManagementAPI.LegalEntitiesApi.getLegalEntity(legalEntityId)
  )
}
export async function updateLegalEntity(
  organizationId: string,
  legalEntityInfo: LegalEntityInfo
): Promise<LegalEntity> {
  return new AdyenRequest(AdyenAPI.LEGAL_ENTITY_MANAGEMENT, 'update legal entity').execute(() =>
    legalEntityManagementAPI.LegalEntitiesApi.updateLegalEntity(organizationId, legalEntityInfo)
  )
}

export async function createTransferInstrument(transferInstrumentInfo: TransferInstrumentInfo) {
  return new AdyenRequest(AdyenAPI.LEGAL_ENTITY_MANAGEMENT, 'create transfer instrument').execute(() =>
    legalEntityManagementAPI.TransferInstrumentsApi.createTransferInstrument(transferInstrumentInfo)
  )
}
