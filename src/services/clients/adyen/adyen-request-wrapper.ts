import createLogger from '@utils/logger'
import { AdyenApiError } from '@root/errors'
import HttpClientException from '@adyen/api-library/lib/src/httpClient/httpClientException'

const logger = createLogger('adyen-request-wrapper.ts')

export class AdyenRequest {
  readonly adyenApi: AdyenAPI
  readonly requestDescription: string

  constructor(adyenApi: AdyenAPI, requestDescription: string) {
    this.adyenApi = adyenApi
    this.requestDescription = requestDescription
  }

  async execute<T>(executor: () => Promise<T>): Promise<T> {
    const startTime = Date.now()

    logger.info(`Calling Adyen to ${this.requestDescription}`, {
      adyen_api: this.adyenApi.toLowerCase(),
      description: this.requestDescription,
    })

    return executor()
      .catch((error: HttpClientException) => {
        logger.info(`Calling Adyen to ${this.requestDescription} failed`, {
          adyen_api: this.adyenApi.toLowerCase(),
          description: this.requestDescription,
          error: error.message,
          adyen_error: {
            status_code: error.apiError?.status,
            error_code: error.apiError?.errorCode,
            message: error.apiError?.message,
            detail: error.apiError?.detail,
            error_type: error.apiError?.errorType,
            psp_reference: error.apiError?.pspReference,
            instance: error.apiError?.instance,
            invalid_fields: error.apiError?.invalidFields,
            request_id: error.apiError?.requestId,
            title: error.apiError?.title,
            type: error.apiError?.type,
            error_body: error.responseBody,
            name: error.name,
          },
        })
        throw new AdyenApiError(error.message)
      })
      .finally(() => {
        const responseTime = Date.now() - startTime
        logger.info(`Calling Adyen to ${this.requestDescription} ended - elapsed time: ${responseTime} ms`, {
          service: this.adyenApi.toLowerCase(),
          description: this.requestDescription,
        })
      })
  }
}

export const AdyenAPI = {
  LEGAL_ENTITY_MANAGEMENT: 'LEGAL_ENTITY_MANAGEMENT',
  BALANCE_PLATFORM: 'BALANCE_PLATFORM',
  MANAGEMENT: 'MANAGEMENT',
} as const

type AdyenAPI = (typeof AdyenAPI)[keyof typeof AdyenAPI]
