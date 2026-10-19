import { Client, EnvironmentEnum, ManagementAPI } from '@adyen/api-library'
import { PaymentMethod } from '@adyen/api-library/lib/src/typings/checkout/paymentMethod'
import { PaymentMethodSetupInfo } from '@adyen/api-library/lib/src/typings/management/paymentMethodSetupInfo'

const ADYEN_COMPANY_ACCOUNT_API_KEY = process.env.ADYEN_COMPANY_ACCOUNT_API_KEY
const ADYEN_ENVIRONMENT = process.env.ADYEN_ENVIRONMENT === 'LIVE' ? EnvironmentEnum.LIVE : EnvironmentEnum.TEST

const client = new Client({ apiKey: ADYEN_COMPANY_ACCOUNT_API_KEY, environment: ADYEN_ENVIRONMENT })

const managementAPI = new ManagementAPI(client)

export async function requestPaymentMethod(merchantId: string, paymentMethodSetupInfo: PaymentMethodSetupInfo): Promise<PaymentMethod> {
    return managementAPI.PaymentMethodsMerchantLevelApi.requestPaymentMethod(merchantId, paymentMethodSetupInfo)
}
