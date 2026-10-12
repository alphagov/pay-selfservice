import { Client, EnvironmentEnum, LegalEntityManagementAPI, Types } from '@adyen/api-library'

const ADYEN_LEGAL_ENTITY_MANAGEMENT_API_KEY = process.env.ADYEN_LEGAL_ENTITY_MANAGEMENT_API_KEY
const ADYEN_ENVIRONMENT = process.env.ADYEN_ENVIRONMENT === 'LIVE' ? EnvironmentEnum.LIVE : EnvironmentEnum.TEST

type LegalEntity = Types.legalEntityManagement.LegalEntity
type LegalEntityInfo = Types.legalEntityManagement.LegalEntityInfo
type LegalEntityInfoRequiredType = Types.legalEntityManagement.LegalEntityInfoRequiredType

const client = new Client({ apiKey: ADYEN_LEGAL_ENTITY_MANAGEMENT_API_KEY, environment: ADYEN_ENVIRONMENT })

const legalEntityManagementAPI = new LegalEntityManagementAPI(client)

export async function createLegalEntity(legalEntityInfo: LegalEntityInfoRequiredType): Promise<LegalEntity> {
  return legalEntityManagementAPI.LegalEntitiesApi.createLegalEntity(legalEntityInfo)
}

export async function getLegalEntity(legalEntityId: string): Promise<LegalEntity> {
  return legalEntityManagementAPI.LegalEntitiesApi.getLegalEntity(legalEntityId)
}

export async function updateLegalEntity(
  organizationId: string,
  legalEntityInfo: LegalEntityInfo
): Promise<LegalEntity> {
  return legalEntityManagementAPI.LegalEntitiesApi.updateLegalEntity(organizationId, legalEntityInfo)
}
