import { ConnectorStates } from '@models/transaction/types/status'
import {
  getPeriodUKDateTimeRange,
  Period,
  TRANSACTION_FILTER_PERIODS,
} from '@utils/simplified-account/services/dashboard/datetime-utils'
import { TransactionSearchParamsData } from '@models/transaction/dto/TransactionSearchParams.dto'
import {
  DisputeStatusFilterMapping,
  PaymentStatusFilterMapping,
  RefundStatusFilterMapping,
} from '@utils/simplified-account/services/transactions/status-filters'
import { parseTransactionSearchDateTime } from '@utils/time/parse-date-time'
import type { DateTime } from 'luxon'
import { TRANSACTION_SEARCH_DATE_FORMAT } from '@utils/time/time-formats'
import { TimeConstants } from '@utils/time/time-constants'

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
  jsEnabled?: string
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
  fromDate?: DateTime<true>
  toDate?: DateTime<true>
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

  hasUserSelectedFilters() {
    const filters = this.getQueryParams()
    filters.delete('page')
    return filters.toString().length > 0
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

    Object.assign(searchParams, processDateAndTime(queryParams))

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

interface DateTimeSearchParams {
  dateFilter?: string
  fromDate?: DateTime<true>
  toDate?: DateTime<true>
  fromTime?: string
  toTime?: string
  includeTime?: boolean
}

const processDateAndTime = (queryParams: TransactionSearchQuery): DateTimeSearchParams => {
  const searchParams: DateTimeSearchParams = {}

  const dateRange = getPeriodUKDateTimeRange(queryParams.dateFilter as Period)
  const isJsEnabled = queryParams.jsEnabled !== 'false'
  const isDateFilterValidPeriod = TRANSACTION_FILTER_PERIODS.has(queryParams.dateFilter as Period)

  const isDateRangeEntered = Boolean(queryParams.fromDate) || Boolean(queryParams.toDate)
  const isJsDateFilterSearch = isJsEnabled && !isDateRangeEntered && isDateFilterValidPeriod
  // with JS disabled, override any entered dates & times if the filter is valid
  const isNoJsDateFilterSearch = !isJsEnabled && isDateFilterValidPeriod

  if (isJsDateFilterSearch || isNoJsDateFilterSearch) {
    searchParams.dateFilter = queryParams.dateFilter
    searchParams.fromDate = dateRange.start
    searchParams.toDate = dateRange.end
    searchParams.includeTime = false

    return searchParams
  }

  if (queryParams.fromDate || queryParams.toDate) {
    searchParams.fromDate = parseTransactionSearchDateTime(
      queryParams.fromDate ?? '',
      queryParams.fromTime ?? '',
      queryParams.includeTime === 'include',
      TimeConstants.TWELVE_MONTHS_AGO
    )

    // parse end date/time, clamp to end of day if not including time
    const toDate = parseTransactionSearchDateTime(
      queryParams.toDate ?? '',
      queryParams.toTime ?? '',
      queryParams.includeTime === 'include',
      TimeConstants.END_OF_TODAY
    )
    searchParams.toDate = queryParams.includeTime === 'include' ? toDate : toDate.endOf('day')

    // if the selected dates match the filter, persist the filter, otherwise set to custom-range
    // this ensures the correct filter is displayed to the user
    searchParams.dateFilter =
      isSameDate(queryParams.fromDate, dateRange.start) && isSameDate(queryParams.toDate, dateRange.end)
        ? queryParams.dateFilter
        : 'custom-range'

    searchParams.includeTime = queryParams.includeTime === 'include'
  }

  return searchParams
}

function isSameDate(dateString: string | undefined, date: DateTime | undefined) {
  return dateString === date?.toFormat(TRANSACTION_SEARCH_DATE_FORMAT)
}
