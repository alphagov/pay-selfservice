import { Client, EnvironmentEnum, HttpURLConnectionClient, ManagementAPI, Types } from '@adyen/api-library'
import { AdyenMockServerHttpClient } from '@services/clients/adyen/adyen-mock-server-http-client'
import { AdyenAPI, AdyenRequest } from '@services/clients/adyen/adyen-request-wrapper'

const ADYEN_COMPANY_ACCOUNT_API_KEY = process.env.ADYEN_COMPANY_ACCOUNT_API_KEY
const ADYEN_ENVIRONMENT = process.env.ADYEN_ENVIRONMENT === 'LIVE' ? EnvironmentEnum.LIVE : EnvironmentEnum.TEST
const ADYEN_MOCK_SERVER_URL = process.env.ADYEN_MOCK_SERVER_URL

type Store = Types.management.Store
type StoreCreationWithMerchantCodeRequest = Types.management.StoreCreationWithMerchantCodeRequest

const client = new Client(
  { apiKey: ADYEN_COMPANY_ACCOUNT_API_KEY, environment: ADYEN_ENVIRONMENT },
  ADYEN_MOCK_SERVER_URL ? new AdyenMockServerHttpClient(ADYEN_MOCK_SERVER_URL) : undefined
)

if (
  process.env.HTTPS_PROXY_HOST &&
  process.env.HTTPS_PROXY_PORT &&
  Number.isInteger(Number(process.env.HTTPS_PROXY_PORT))
) {
  const httpClient = new HttpURLConnectionClient()
  httpClient.proxy = { host: process.env.HTTPS_PROXY_HOST, port: Number(process.env.HTTPS_PROXY_PORT) }

  client.httpClient = httpClient
}

const managementAPI = new ManagementAPI(client)

export async function createStore(storeCreationRequest: StoreCreationWithMerchantCodeRequest): Promise<Store> {
  return new AdyenRequest(AdyenAPI.MANAGEMENT, 'create store').execute(() =>
    managementAPI.AccountStoreLevelApi.createStore(storeCreationRequest)
  )
}
