import { ConnectorStates } from '@models/transaction/types/status'
import { getPeriodUKDateTimeRange, Period } from '@utils/simplified-account/services/dashboard/datetime-utils'
import { TransactionSearchParamsData } from '@models/transaction/dto/TransactionSearchParams.dto'
import {
  DisputeStatusFilterMapping,
  PaymentStatusFilterMapping,
  RefundStatusFilterMapping,
} from '@utils/simplified-account/services/transactions/status-filters'
import { parseDateTime } from '@utils/time/parse-date-time'
import type { DateTime } from 'luxon'

interface TransactionSearchQuery {
  cardholderName?: string
  lastDigitsCardNumber?: string
  metadataValue?: string
  brand?: string | string[]
  reference?: string
  email?: string
  dateFilter?: string
  state?: string | string[]
  page?: string | number
  fromDate?: string
  toDate?: string
  fromTime?: string
  toTime?: string
  includeTime?: string
  gatewayPayoutId?: string
}

export class TransactionSearchParams {
  accountIds: number[] | string[]
  agreementId?: string
  displaySize?: number
  page?: number
  limitTotal?: boolean
  limitTotalSize?: number
  cardholderName?: string
  lastDigitsCardNumber?: string
  metadataValue?: string
  brand?: string[]
  reference?: string
  email?: string
  type?: string
  dateFilter?: string
  fromDate?: DateTime
  toDate?: DateTime
  state?: string[]
  paymentStates?: string[]
  refundStates?: string[]
  disputeStates?: string[]
  gatewayPayoutId?: string
  motoHeader?: boolean
  feeHeaders?: boolean
  baseQuery?: TransactionSearchQuery
  includeTime?: boolean
  withPagination: boolean

  constructor(gatewayAccountIds: number[] | string[], withPagintion: boolean) {
    this.accountIds = gatewayAccountIds
    this.withPagination = withPagintion
  }

  toJson() {
    return new TransactionSearchParamsData(this)
  }

  getQueryParams() {
    const urlParams = new URLSearchParams()

    Object.entries(this.baseQuery as Record<string, string>).forEach(([key, value]: [string, string]) => {
      if (value !== undefined && value !== null) {
        urlParams.set(key, value)
      }
    })

    return urlParams
  }

  getFilterKeys(): string[] {
    return Object.entries(this)
      .filter(([_key, value]) => value !== undefined)
      .map(([key, _value]) => key)
      .sort()
  }

  static forAgreement(gatewayAccountId: number, agreementExternalId: string, currentPage: number, displaySize: number) {
    const searchParams = new TransactionSearchParams([gatewayAccountId], true)
    searchParams.page = currentPage
    searchParams.displaySize = displaySize
    searchParams.agreementId = agreementExternalId
    return searchParams
  }

  static fromSearchQuery(
    gatewayAccountIds: number | number[] | string | string[],
    queryParams: TransactionSearchQuery,
    withPagination: boolean,
    pageSize?: number
  ) {
    // @ts-expect-error while `number[] | string[]` and `(number | string)[]` are not interchangeable
    // this is valid because we are constructing an array of length 1, so every element of the array is the same type
    const accountIds: number[] | string[] = Array.isArray(gatewayAccountIds) ? gatewayAccountIds : [gatewayAccountIds]
    const searchParams = new TransactionSearchParams(accountIds, withPagination)

    if (withPagination) {
      searchParams.page = parsePageNumber(
        typeof queryParams.page === 'string' ? queryParams.page : `${queryParams.page}`
      )
      searchParams.displaySize = pageSize
    }

    searchParams.baseQuery = queryParams

    searchParams.cardholderName = nonEmpty(queryParams.cardholderName)
    searchParams.lastDigitsCardNumber = nonEmpty(queryParams.lastDigitsCardNumber)
    searchParams.metadataValue = nonEmpty(queryParams.metadataValue)
    searchParams.reference = nonEmpty(queryParams.reference)
    searchParams.email = nonEmpty(queryParams.email)

    if (queryParams.brand === undefined || queryParams.brand === '') {
      searchParams.brand = undefined
    } else if (Array.isArray(queryParams.brand)) {
      searchParams.brand = queryParams.brand
    } else {
      searchParams.brand = queryParams.brand.split(',')
    }

    if (queryParams.fromDate || queryParams.toDate) {
      searchParams.fromDate = parseDateTime(
        queryParams.fromDate!,
        queryParams.fromTime!,
        queryParams.includeTime === 'include'
      )

      // parse end date/time, clamp to end of day if not including time
      const toDate = parseDateTime(queryParams.toDate!, queryParams.toTime!, queryParams.includeTime === 'include')
      searchParams.toDate = queryParams.includeTime === 'include' ? toDate : toDate.endOf('day')

      searchParams.dateFilter = queryParams.dateFilter
      searchParams.includeTime = queryParams.includeTime === 'include'
    } else if (queryParams.dateFilter) {
      const dateRange = getPeriodUKDateTimeRange(queryParams.dateFilter as Period)

      searchParams.dateFilter = queryParams.dateFilter
      searchParams.fromDate = dateRange.start
      searchParams.toDate = dateRange.end
      searchParams.includeTime = false
    }

    if (queryParams.state) {
      const stateFilters = convertStateFilter(queryParams.state)

      searchParams.state = Array.isArray(queryParams.state) ? queryParams.state : [queryParams.state]
      searchParams.paymentStates = stateFilters.paymentStates
      searchParams.refundStates = stateFilters.refundStates
      searchParams.disputeStates = stateFilters.disputeStates
    }

    if (queryParams.gatewayPayoutId) {
      searchParams.gatewayPayoutId = queryParams.gatewayPayoutId
    }

    return searchParams
  }
}

function convertStateFilter(stateFilters: string | string[]): ConnectorStates {
  const selected = Array.isArray(stateFilters) ? stateFilters : [stateFilters]
  const paymentStates = selected
    .filter((filterId) => PaymentStatusFilterMapping.has(filterId))
    .flatMap((filerId) => PaymentStatusFilterMapping.get(filerId)!)
  const refundStates = selected
    .filter((filterId) => RefundStatusFilterMapping.has(filterId))
    .flatMap((filerId) => RefundStatusFilterMapping.get(filerId)!)
  const disputeStates = selected
    .filter((filterId) => DisputeStatusFilterMapping.has(filterId))
    .flatMap((filerId) => DisputeStatusFilterMapping.get(filerId)!)

  return {
    paymentStates: paymentStates.length !== 0 ? paymentStates : undefined,
    refundStates: refundStates.length !== 0 ? refundStates : undefined,
    disputeStates: disputeStates.length !== 0 ? disputeStates : undefined,
  }
}

function parsePageNumber(pageNumber?: string) {
  if (!pageNumber) {
    return 1
  }

  const parsedPageNumber = Number(pageNumber)
  if (isNaN(parsedPageNumber) || parsedPageNumber < 1) {
    return 1
  }

  return parsedPageNumber
}

const nonEmpty = (value: string | undefined) => {
  return value === '' ? undefined : value
}
