import { Client, EnvironmentEnum, BalancePlatformAPI, Types } from '@adyen/api-library'
import { AdyenMockServerHttpClient } from '@services/clients/adyen/adyen-mock-server-http-client'

const ADYEN_BALANCE_PLATFORM_API_KEY = process.env.ADYEN_BALANCE_PLATFORM_API_KEY
const ADYEN_ENVIRONMENT = process.env.ADYEN_ENVIRONMENT === 'LIVE' ? EnvironmentEnum.LIVE : EnvironmentEnum.TEST
const ADYEN_MOCK_SERVER_URL = process.env.ADYEN_MOCK_SERVER_URL

type AccountHolder = Types.balancePlatform.AccountHolder
type AccountHolderInfo = Types.balancePlatform.AccountHolderInfo

const client = new Client(
  { apiKey: ADYEN_BALANCE_PLATFORM_API_KEY, environment: ADYEN_ENVIRONMENT },
  ADYEN_MOCK_SERVER_URL ? new AdyenMockServerHttpClient(ADYEN_MOCK_SERVER_URL) : undefined
)

const balancePlatformAPI = new BalancePlatformAPI(client)

export async function createAccountHolder(accountHolderInfo: AccountHolderInfo): Promise<AccountHolder> {
  return balancePlatformAPI.AccountHoldersApi.createAccountHolder(accountHolderInfo)
}
