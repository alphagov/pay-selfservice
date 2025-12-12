import { ConnectorStates } from '@models/ledger/types/status'
import { displayStatesToConnectorStates } from '@utils/simplified-account/services/transactions/transaction-status-utils'
import { getPeriodUKDateTimeRange, Period } from '@utils/simplified-account/services/dashboard/datetime-utils'
import { LedgerTransactionParamsData } from '@models/ledger/dto/TransactionSearchParams.dto'

interface TransactionSearchQuery {
  cardholderName?: string
  lastDigitsCardNumber?: string
  metadataValue?: string
  brand?: string
  reference?: string
  email?: string
  dateFilter?: string
  state?: string[]
}

export class TransactionSearchParams {
  accountIds: [number]
  agreementId?: string
  currentPage: number
  displaySize?: number
  page?: number
  pageSize: number
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

  constructor(gatewayAccountId: number, currentPage: number, pageSize: number) {
    this.accountIds = [gatewayAccountId]
    this.currentPage = currentPage
    this.pageSize = pageSize
  }

  toLedgerSearchParams() {
    return new LedgerTransactionParamsData(this)
  }

  static fromSearchQuery(
    gatewayAccountId: number,
    currentPage: number,
    pageSize: number,
    queryParams: TransactionSearchQuery
  ) {
    const searchParams = new TransactionSearchParams(gatewayAccountId, currentPage, pageSize)

    searchParams.cardholderName = queryParams.cardholderName
    searchParams.lastDigitsCardNumber = queryParams.lastDigitsCardNumber
    searchParams.metadataValue = queryParams.metadataValue
    searchParams.brand = queryParams.brand
    searchParams.reference = queryParams.reference
    searchParams.email = queryParams.email

    if (queryParams.dateFilter) {
      const dateRange = getPeriodUKDateTimeRange(queryParams.dateFilter as Period)

      searchParams.dateFilter = queryParams.dateFilter
      searchParams.fromDate = dateRange.start.toISO()!
      searchParams.toDate = dateRange.end.toISO()!
    }

    if (queryParams.state) {
      const stateFilters = convertStateFilter(queryParams.state)

      searchParams.state = queryParams.state
      searchParams.paymentStates = stateFilters.paymentStates
      searchParams.refundStates = stateFilters.refundStates
      searchParams.disputeStates = stateFilters.disputeStates
    }

    return searchParams
  }
}

function convertStateFilter(stateFilters: string[]): ConnectorStates {
  return displayStatesToConnectorStates(stateFilters)
}
