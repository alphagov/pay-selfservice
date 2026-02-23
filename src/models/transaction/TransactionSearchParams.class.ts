import { ConnectorStates } from '@models/transaction/types/status'
import { getPeriodUKDateTimeRange, Period } from '@utils/simplified-account/services/dashboard/datetime-utils'
import { TransactionSearchParamsData } from '@models/transaction/dto/TransactionSearchParams.dto'
import {
  DisputeStatusFilterMapping,
  PaymentStatusFilterMapping,
  RefundStatusFilterMapping,
} from '@utils/simplified-account/services/transactions/status-filters'

interface TransactionSearchQuery {
  cardholderName?: string
  lastDigitsCardNumber?: string
  metadataValue?: string
  brand?: string
  reference?: string
  email?: string
  dateFilter?: string
  state?: string | string[]
  page?: string | number
}

export class TransactionSearchParams {
  accountIds: [number]
  agreementId?: string
  currentPage: number
  displaySize?: number
  page?: number
  limitTotal?: boolean
  limitTotalSize?: number
  cardholderName?: string
  lastDigitsCardNumber?: string
  metadataValue?: string
  brand?: string
  reference?: string
  email?: string
  type?: string
  dateFilter?: string
  fromDate?: string
  toDate?: string
  state?: string[]
  paymentStates?: string[]
  refundStates?: string[]
  disputeStates?: string[]
  baseQuery?: TransactionSearchQuery

  constructor(gatewayAccountId: number, currentPage: number, displaySize: number) {
    this.accountIds = [gatewayAccountId]
    this.currentPage = currentPage
    this.displaySize = displaySize
  }

  toJson() {
    return new TransactionSearchParamsData(this)
  }

  getQueryParams() {
    return new URLSearchParams(this.baseQuery as Record<string, string>)
  }

  static forAgreement(gatewayAccountId: number, agreementExternalId: string, currentPage: number, displaySize: number) {
    const searchParams = new TransactionSearchParams(gatewayAccountId, currentPage, displaySize)
    searchParams.agreementId = agreementExternalId
    return searchParams
  }

  static fromSearchQuery(gatewayAccountId: number, pageSize: number, queryParams: TransactionSearchQuery) {
    const currentPageNumber = parsePageNumber(
      typeof queryParams.page === 'string' ? queryParams.page : `${queryParams.page}`
    )

    const searchParams = new TransactionSearchParams(gatewayAccountId, currentPageNumber, pageSize)
    searchParams.baseQuery = queryParams

    searchParams.cardholderName = nonEmpty(queryParams.cardholderName)
    searchParams.lastDigitsCardNumber = nonEmpty(queryParams.lastDigitsCardNumber)
    searchParams.metadataValue = nonEmpty(queryParams.metadataValue)
    searchParams.brand = nonEmpty(queryParams.brand)
    searchParams.reference = nonEmpty(queryParams.reference)
    searchParams.email = nonEmpty(queryParams.email)

    if (queryParams.dateFilter) {
      const dateRange = getPeriodUKDateTimeRange(queryParams.dateFilter as Period)

      searchParams.dateFilter = queryParams.dateFilter
      searchParams.fromDate = dateRange.start.toISO()!
      searchParams.toDate = dateRange.end.toISO()!
    }

    if (queryParams.state) {
      const stateFilters = convertStateFilter(queryParams.state)

      searchParams.state = Array.isArray(queryParams.state) ? queryParams.state : [queryParams.state]
      searchParams.paymentStates = stateFilters.paymentStates
      searchParams.refundStates = stateFilters.refundStates
      searchParams.disputeStates = stateFilters.disputeStates
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
