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

declare module '@govuk-pay/pay-js-commons/lib/logging/keys' {
  export const PAYMENT_TYPE = 'payment_type'
  export const RESOURCE_TYPE = 'resource_type'
  export const PROVIDER = 'provider'
  export const WALLET = 'wallet'
  export const GATEWAY_ACCOUNT_TYPE = 'gateway_account_type'
  export const GATEWAY_CARD_OPERATION = 'gateway_card_operation'
  export const AMOUNT = 'amount'
  export const MANDATE_EXTERNAL_ID = 'mandate_external_id'
  export const PROVIDER_PAYMENT_ID = 'provider_payment_id'
  export const PROVIDER_EVENT_ID = 'provider_event_id'
  export const SERVICE_PAYMENT_REFERENCE = 'service_reference'
  export const GATEWAY_ACCOUNT_ID = 'gateway_account_id'
  export const LEDGER_EVENT_ID = 'ledger_event_id'
  export const LEDGER_EVENT_TYPE = 'ledger_event_type'
  export const DIRECT_DEBIT_INTERNAL_EVENT_TYPE = 'direct_debit_internal_event_type'
  export const CURRENT_INTERNAL_STATE = 'current_internal_state'
  export const PREVIOUS_INTERNAL_STATUS = 'previous_internal_status'
  export const WORLDPAY_LAST_EVENT = 'worldpay_last_event'
  export const SMARTPAY_RESULT_CODE = 'smartpay_result_code'
  export const EPDQ_STATUS = 'epdq_status'
  export const STRIPE_STATUS = 'stripe_status'
  export const GOCARDLESS_PAYMENT_ACTION = 'gocardless_action'
  export const HTTP_STATUS = 'http_status'
  export const REMOTE_HTTP_STATUS = 'remote_http_status'
  export const AWS_ERROR_CODE = 'aws_error_code'
  export const CORRELATION_ID = 'x_request_id'
  export const PAYMENT_EXTERNAL_ID = 'payment_external_id'
  export const REFUND_EXTERNAL_ID = 'refund_external_id'
  export const SECURE_TOKEN = 'secure_token'
  export const USER_EXTERNAL_ID = 'user_external_id'
  export const SERVICE_EXTERNAL_ID = 'service_external_id'
  export const PRODUCT_EXTERNAL_ID = 'product_external_id'
}
