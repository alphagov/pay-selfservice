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
import { TRANSACTION_SEARCH_DATE_FORMAT, TRANSACTION_SEARCH_TIME_FORMAT } from '@utils/time/time-formats'
import { TimeConstants } from '@utils/time/time-constants'
import { omit } from 'lodash'
import { nonEmpty, NonEmptyString, nonEmptyStringArray } from '@utils/types/non-empty-string'

export interface TransactionSearchQuery {
  cardholderName?: unknown
  lastDigitsCardNumber?: unknown
  metadataValue?: unknown
  brand?: unknown
  reference?: unknown
  email?: unknown
  dateFilter?: unknown
  state?: unknown
  page?: unknown
  fromDate?: unknown
  toDate?: unknown
  fromTime?: unknown
  toTime?: unknown
  includeTime?: unknown
  gatewayPayoutId?: unknown
  agreementId?: unknown
  jsEnabled?: unknown
}

export class TransactionSearchParams {
  accountIds: number[] | string[]
  agreementId?: NonEmptyString
  displaySize?: number
  page?: number
  limitTotal?: boolean
  limitTotalSize?: number
  cardholderName?: NonEmptyString
  lastDigitsCardNumber?: NonEmptyString
  metadataValue?: NonEmptyString
  brand?: NonEmptyString[]
  reference?: NonEmptyString
  email?: NonEmptyString
  type?: NonEmptyString
  dateFilter?: Period | 'custom-range'
  fromDate?: DateTime<true>
  toDate?: DateTime<true>
  state?: string[]
  paymentStates?: string[]
  refundStates?: string[]
  disputeStates?: string[]
  gatewayPayoutId?: NonEmptyString
  motoHeader?: boolean
  feeHeaders?: boolean

  private includeTime?: boolean
  private baseQuery?: TransactionSearchQuery
  private hasPagination?: boolean
  private filterCount: number

  constructor(gatewayAccountIds: number[] | string[]) {
    this.accountIds = gatewayAccountIds
    this.filterCount = 0
  }

  static Builder(gatewayAccountIds: number | number[] | string | string[]) {
    // @ts-expect-error while `number[] | string[]` and `(number | string)[]` are not interchangeable
    // this is valid because we are constructing an array of length 1, so every element of the array is the same type
    return new TransactionSearchParams(Array.isArray(gatewayAccountIds) ? gatewayAccountIds : [gatewayAccountIds])
  }

  static forAgreement(gatewayAccountId: number, agreementExternalId: string, currentPage: number, displaySize: number) {
    const searchParams = TransactionSearchParams.Builder(gatewayAccountId).withPagination(displaySize)
    searchParams.page = currentPage
    searchParams.agreementId = agreementExternalId as NonEmptyString
    return searchParams
  }

  withDefaultDateFilter(dateFilter: Period) {
    if (!this.dateFilter && !this.fromDate && !this.toDate) {
      const dateRange = getPeriodUKDateTimeRange(dateFilter)
      this.dateFilter = dateFilter
      this.fromDate = dateRange.start
      this.toDate = dateRange.end
      this.includeTime = false
    }
    return this
  }

  withPagination(displaySize: number) {
    this.hasPagination = true
    this.limitTotal = true
    this.limitTotalSize = 5001
    this.displaySize = displaySize
    return this
  }

  withSearchQuery(queryParams: TransactionSearchQuery) {
    this.filterCount = countFilters(queryParams)
    if (this.hasPagination) {
      this.page = parsePageNumber(queryParams.page)
    }

    this.baseQuery = queryParams
    this.cardholderName = nonEmpty(queryParams.cardholderName)
    this.lastDigitsCardNumber = nonEmpty(queryParams.lastDigitsCardNumber)
    this.metadataValue = nonEmpty(queryParams.metadataValue)
    this.reference = nonEmpty(queryParams.reference)
    this.email = nonEmpty(queryParams.email)
    this.brand = parseAsArray(queryParams.brand)

    Object.assign(this, processDateAndTime(queryParams))

    const selectedStateFilters = parseAsArray(queryParams.state)
    if (selectedStateFilters) {
      const stateFilters = convertStateFilter(selectedStateFilters)

      this.state = selectedStateFilters
      this.paymentStates = stateFilters.paymentStates
      this.refundStates = stateFilters.refundStates
      this.disputeStates = stateFilters.disputeStates
    }

    // not from search, linked to from other pages
    this.gatewayPayoutId = nonEmpty(queryParams.gatewayPayoutId)
    this.agreementId = nonEmpty(queryParams.agreementId)

    return this
  }

  withFeeHeaders(includeFeeHeaders?: boolean) {
    this.feeHeaders = includeFeeHeaders
    return this
  }

  withMotoHeader(includeMotoHeader?: boolean) {
    this.motoHeader = includeMotoHeader
    return this
  }

  toJson() {
    return new TransactionSearchParamsData(this)
  }

  // query params to recreate the same search
  toQueryRecreationPrams() {
    const params: TransactionSearchQuery = {
      cardholderName: this.cardholderName,
      lastDigitsCardNumber: this.lastDigitsCardNumber,
      metadataValue: this.metadataValue,
      brand: this.brand?.join(','),
      reference: this.reference,
      email: this.email,
      dateFilter: this.dateFilter,
      state: this.state?.join(','),
      page: this.page?.toString(),
      fromDate: this.fromDate?.toFormat(TRANSACTION_SEARCH_DATE_FORMAT),
      toDate: this.toDate?.toFormat(TRANSACTION_SEARCH_DATE_FORMAT),
      fromTime: this.includeTime ? this.fromDate?.toFormat(TRANSACTION_SEARCH_TIME_FORMAT) : undefined,
      toTime: this.includeTime ? this.toDate?.toFormat(TRANSACTION_SEARCH_TIME_FORMAT) : undefined,
      includeTime: this.includeTime ? 'include' : undefined,
      gatewayPayoutId: this.gatewayPayoutId,
      agreementId: this.agreementId,
    }

    const urlParams = new URLSearchParams()

    Object.entries(params as Record<string, string>).forEach(([key, value]: [string, string]) => {
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

  isRefinedSearch() {
    // not a refined search if the only filter is an all-time date range
    return this.hasUserSelectedFilters() && !this.isUnfilteredAllTimeSearch()
  }

  hasUserSelectedFilters() {
    return this.filterCount > 0
  }

  isUnfilteredAllTimeSearch() {
    return this.filterCount === 1 && this.baseQuery?.dateFilter === Period.ALL_TIME
  }
}

function convertStateFilter(selected: string[]): ConnectorStates {
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

function parsePageNumber(pageNumber: unknown) {
  if (typeof pageNumber === 'number') {
    return pageNumber
  }

  if (typeof pageNumber !== 'string' || pageNumber === '') {
    return 1
  }

  const parsedPageNumber = Number(pageNumber)
  if (isNaN(parsedPageNumber) || parsedPageNumber < 1) {
    return 1
  }

  return parsedPageNumber
}

type DateTimeSearchParams = Pick<TransactionSearchParams, 'dateFilter' | 'fromDate' | 'toDate'> & {
  includeTime?: boolean
}

const processDateAndTime = (queryParams: TransactionSearchQuery): DateTimeSearchParams => {
  const fromDate = asString(queryParams.fromDate)
  const toDate = asString(queryParams.toDate)
  const fromTime = asString(queryParams.fromTime)
  const toTime = asString(queryParams.toTime)

  const searchParams: DateTimeSearchParams = {}

  const dateRange = getPeriodUKDateTimeRange(queryParams.dateFilter)
  const isJsEnabled = queryParams.jsEnabled !== 'false'
  const isDateFilterValidPeriod = TRANSACTION_FILTER_PERIODS.has(queryParams.dateFilter as Period)

  const isDateRangeEntered = Boolean(queryParams.fromDate) || Boolean(queryParams.toDate)
  const isJsDateFilterSearch = isJsEnabled && !isDateRangeEntered && isDateFilterValidPeriod
  // with JS disabled, override any entered dates & times if the filter is valid
  const isNoJsDateFilterSearch = !isJsEnabled && isDateFilterValidPeriod

  if (isJsDateFilterSearch || isNoJsDateFilterSearch) {
    searchParams.dateFilter = dateRange.period
    searchParams.fromDate = dateRange.start
    searchParams.toDate = dateRange.end
    searchParams.includeTime = false

    return searchParams
  }

  if (queryParams.fromDate || queryParams.toDate) {
    searchParams.fromDate = parseTransactionSearchDateTime(
      fromDate,
      fromTime,
      queryParams.includeTime === 'include',
      TimeConstants.TWELVE_MONTHS_AGO
    )

    // parse end date/time, clamp to end of day if not including time
    const parsedToDate = parseTransactionSearchDateTime(
      toDate,
      toTime,
      queryParams.includeTime === 'include',
      TimeConstants.END_OF_TODAY
    )
    searchParams.toDate = queryParams.includeTime === 'include' ? parsedToDate : parsedToDate.endOf('day')

    // if the selected dates match the filter, persist the filter, otherwise set to custom-range
    // this ensures the correct filter is displayed to the user
    searchParams.dateFilter =
      isSameDate(fromDate, dateRange.start) && isSameDate(toDate, dateRange.end) ? dateRange.period : 'custom-range'

    searchParams.includeTime = queryParams.includeTime === 'include'
  }

  return searchParams
}

function isSameDate(dateString: string | undefined, date: DateTime | undefined) {
  return dateString === date?.toFormat(TRANSACTION_SEARCH_DATE_FORMAT)
}

function parseAsArray(queryParam: unknown): NonEmptyString[] | undefined {
  if (
    queryParam === undefined ||
    queryParam === null ||
    queryParam === '' ||
    (Array.isArray(queryParam) && queryParam.length === 0)
  ) {
    return undefined
  } else if (Array.isArray(queryParam)) {
    return nonEmptyStringArray(queryParam)
  } else if (typeof queryParam !== 'string') {
    return undefined
  } else {
    return nonEmptyStringArray(queryParam.split(','))
  }
}

function countFilters(query: TransactionSearchQuery): number {
  return Object.values(omit(query, ['page', 'jsEnabled'])).filter(
    (queryParam) => !(queryParam === '' || queryParam === null || queryParam === undefined)
  ).length
}

function asString(value: unknown): string {
  if (typeof value !== 'string') {
    return ''
  }
  return value
}
