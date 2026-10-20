import { BalancePlatformAPI, Client, EnvironmentEnum, Types } from '@adyen/api-library'
import { CreateSweepConfigurationV2 } from '@adyen/api-library/lib/src/typings/balancePlatform/createSweepConfigurationV2'
import { AdyenMockServerHttpClient } from '@services/clients/adyen/adyen-mock-server-http-client'
import { AdyenAPI, AdyenRequest } from '@services/clients/adyen/adyen-request-wrapper'

const ADYEN_BALANCE_PLATFORM_API_KEY = process.env.ADYEN_BALANCE_PLATFORM_API_KEY
const ADYEN_ENVIRONMENT = process.env.ADYEN_ENVIRONMENT === 'LIVE' ? EnvironmentEnum.LIVE : EnvironmentEnum.TEST
const ADYEN_MOCK_SERVER_URL = process.env.ADYEN_MOCK_SERVER_URL

type AccountHolder = Types.balancePlatform.AccountHolder
type AccountHolderInfo = Types.balancePlatform.AccountHolderInfo
type BalanceAccount = Types.balancePlatform.BalanceAccount
type BalanceAccountInfo = Types.balancePlatform.BalanceAccountInfo

const client = new Client(
  { apiKey: ADYEN_BALANCE_PLATFORM_API_KEY, environment: ADYEN_ENVIRONMENT },
  ADYEN_MOCK_SERVER_URL ? new AdyenMockServerHttpClient(ADYEN_MOCK_SERVER_URL) : undefined
)

const balancePlatformAPI = new BalancePlatformAPI(client)

export async function createSweep(balanceAccountId: string, sweepConfiguration: CreateSweepConfigurationV2) {
  return new AdyenRequest(AdyenAPI.BALANCE_PLATFORM, 'create account holder').execute(() =>
    balancePlatformAPI.CustomPayoutSchedulesSweepsApi.createSweep(balanceAccountId, sweepConfiguration)
  )
}

export async function createAccountHolder(accountHolderInfo: AccountHolderInfo): Promise<AccountHolder> {
  return new AdyenRequest(AdyenAPI.BALANCE_PLATFORM, 'create account holder').execute(() =>
    balancePlatformAPI.AccountHoldersApi.createAccountHolder(accountHolderInfo)
  )
}

export async function createBalanceAccount(balanceAccountInfo: BalanceAccountInfo): Promise<BalanceAccount> {
  return new AdyenRequest(AdyenAPI.BALANCE_PLATFORM, 'create balance account').execute(() =>
    balancePlatformAPI.BalanceAccountsApi.createBalanceAccount(balanceAccountInfo)
  )
}
