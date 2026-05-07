declare module '@govuk-pay/pay-js-commons/lib/utils/axios-base-client/errors' {
  export class RESTClientError extends Error {
    name: string
    service: string
    errorCode: number
    errorIdentifier: unknown
    reason: string

    constructor(message: string, service: string, errorCode: number, errorIdentifier: unknown, reason: string)
  }
}
