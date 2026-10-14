import { Client, EnvironmentEnum, BalancePlatformAPI, Types } from '@adyen/api-library'

const ADYEN_BALANCE_PLATFORM_API_KEY = process.env.ADYEN_BALANCE_PLATFORM_API_KEY
const ADYEN_ENVIRONMENT = process.env.ADYEN_ENVIRONMENT === 'LIVE' ? EnvironmentEnum.LIVE : EnvironmentEnum.TEST

type BalanceAccount = Types.balancePlatform.BalanceAccount
type BalanceAccountInfo = Types.balancePlatform.BalanceAccountInfo

const client = new Client({ apiKey: ADYEN_BALANCE_PLATFORM_API_KEY, environment: ADYEN_ENVIRONMENT })

const balancePlatformAPI = new BalancePlatformAPI(client)

export async function createBalanceAccount(balanceAccountInfo: BalanceAccountInfo): Promise<BalanceAccount> {
  return balancePlatformAPI.BalanceAccountsApi.createBalanceAccount(balanceAccountInfo)
}
