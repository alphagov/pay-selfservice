import { Client, EnvironmentEnum, HttpURLConnectionClient, ManagementAPI } from '@adyen/api-library'

const ADYEN_COMPANY_ACCOUNT_API_KEY = process.env.ADYEN_COMPANY_ACCOUNT_API_KEY
const ADYEN_ENVIRONMENT = process.env.ADYEN_ENVIRONMENT === 'LIVE' ? EnvironmentEnum.LIVE : EnvironmentEnum.TEST

const client = new Client({ apiKey: ADYEN_COMPANY_ACCOUNT_API_KEY, environment: ADYEN_ENVIRONMENT })

if (
  process.env.HTTPS_PROXY_HOST &&
  process.env.HTTPS_PROXY_PORT &&
  Number.isInteger(Number(process.env.HTTPS_PROXY_PORT))
) {
  const httpClient = new HttpURLConnectionClient()
  httpClient.proxy = { host: process.env.HTTPS_PROXY_HOST, port: Number(process.env.HTTPS_PROXY_PORT) }

  client.httpClient = httpClient
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const managementAPI = new ManagementAPI(client)
