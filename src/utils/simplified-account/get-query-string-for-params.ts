import querystring from 'querystring'
import _ from 'lodash'
import { fromDateToApiFormat, toDateToApiFormat } from './dates'

export interface QueryParams {
  reference?: string
  email?: string
  cardholderName?: string
  lastDigitsCardNumber?: string
  brand?: string | string[]
  gatewayPayoutId?: string
  fromDate?: string
  fromTime?: string
  toDate?: string
  toTime?: string
  feeHeaders?: string
  motoHeader?: string
  metadataValue?: string
  agreementId?: string
  page?: number
  pageSize?: number
  payment_states?: string | string[]
  refund_states?: string | string[]
  dispute_states?: string | string[]
  [key: string]: unknown
}

function getQueryStringForParams(
  params: QueryParams = {},
  removeEmptyParams = false,
  flattenCardBrandsParam = false,
  ignorePagination = false
): string {
  let queryStrings: Record<string, string | number | boolean | null | undefined> = {
    reference: params.reference,
    email: params.email,
    cardholder_name: params.cardholderName,
    last_digits_card_number: params.lastDigitsCardNumber,
    card_brand: Array.isArray(params.brand) ? params.brand.join(',') : params.brand,
    gateway_payout_id: params.gatewayPayoutId,
    from_date: fromDateToApiFormat(params.fromDate, params.fromTime),
    to_date: toDateToApiFormat(params.toDate, params.toTime),
    ...(params.feeHeaders ? { fee_headers: params.feeHeaders } : {}),
    ...(params.motoHeader ? { moto_header: params.motoHeader } : {}),
    metadata_value: params.metadataValue,
    agreement_id: params.agreementId,
  }

  if (!ignorePagination) {
    queryStrings.page = params.page ?? 1
    queryStrings.display_size = params.pageSize ?? 100
  }

  if (params.payment_states) {
    queryStrings.payment_states = Array.isArray(params.payment_states)
      ? params.payment_states.join(',')
      : params.payment_states
  }
  if (params.refund_states) {
    queryStrings.refund_states = Array.isArray(params.refund_states)
      ? params.refund_states.join(',')
      : params.refund_states
  }
  if (params.dispute_states) {
    queryStrings.dispute_states = Array.isArray(params.dispute_states)
      ? params.dispute_states.join(',')
      : params.dispute_states
  }

  if (flattenCardBrandsParam) {
    queryStrings.card_brands = Array.isArray(params.brand) ? params.brand.join(',') : params.brand
    delete queryStrings.card_brand
  }

  if (removeEmptyParams) {
    queryStrings = _.pickBy(queryStrings, (v) => v)
  }

  return querystring.stringify(queryStrings)
}

export default getQueryStringForParams
