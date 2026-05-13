// typeRoots option in tsconfig assumes all directories are packages
// can't have types in nested directory @govuk-pay/pay-js-commons
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
