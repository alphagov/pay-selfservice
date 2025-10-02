import { BaseClient } from '@services/clients/base/Client.class'
import { TransactionSummary } from '@models/ledger/TransactionSummary.class'
import { TransactionSummaryData } from '@models/ledger/dto/TransactionSummary.dto'
import { Agreement } from '@models/agreements/Agreement.class'
import { AgreementData } from '@models/agreements/dto/Agreement.dto'
import { LedgerTransactionParamsData } from '@services/clients/pay/interfaces/ledger-client'
import { SearchData } from '@models/common/SearchData.dto'
import { TransactionData } from '@models/ledger/dto/Transaction.dto'
import { Transaction } from '@models/ledger/Transaction.class'
import { Event } from '@models/ledger/Event.class'
import { EventsData } from '@models/ledger/dto/Event.dto'

const SERVICE_NAME = 'ledger'
const SERVICE_BASE_URL = process.env.LEDGER_URL!

class LedgerClient extends BaseClient {
  public agreements
  public transactions
  public reports

  constructor() {
    super(SERVICE_BASE_URL, SERVICE_NAME)
    this.agreements = this.agreementsClient
    this.transactions = this.transactionsClient
    this.reports = this.reportsClient
  }

  private get reportsClient() {
    return {
      transactionsSummary: async (gatewayAccountId: number, fromDate: string, toDate: string) => {
        const path =
          '/v1/report/transactions-summary?account_id={gatewayAccountId}&from_date={fromDate}&to_date={toDate}'
            .replace('{gatewayAccountId}', encodeURIComponent(gatewayAccountId))
            .replace('{fromDate}', encodeURIComponent(fromDate))
            .replace('{toDate}', encodeURIComponent(toDate))

        const response = await this.get<TransactionSummaryData>(path, 'get transaction summary')
        return new TransactionSummary(response.data)
      },
    }
  }

  private get transactionsClient() {
    return {
      search: async (params: LedgerTransactionParamsData) => {
        const queryString = params.asQueryString()
        const path = `/v1/transaction?${queryString}`
        const response = await this.get<SearchData<TransactionData>>(path, 'get transactions')
        return {
          total: response.data.total,
          count: response.data.count,
          page: response.data.page,
          transactions: response.data.results.map((transactionData) => new Transaction(transactionData)),
        }
      },
      get: async (transactionExternalId: string, gatewayAccountId: number) => {
        const path = '/v1/transaction/{transactionExternalId}?account_id={gatewayAccountId}'
          .replace('{transactionExternalId}', encodeURIComponent(transactionExternalId))
          .replace('{gatewayAccountId}', encodeURIComponent(gatewayAccountId))
        const response = await this.get<TransactionData>(path, 'get transaction')
        return new Transaction(response.data)
      },
      events: async (transactionExternalId: string, gatewayAccountId: number) => {
        const path = '/v1/transaction/{transactionExternalId}/event?gateway_account_id={gatewayAccountId}'
          .replace('{transactionExternalId}', encodeURIComponent(transactionExternalId))
          .replace('{gatewayAccountId}', encodeURIComponent(gatewayAccountId))
        const response = await this.get<EventsData>(path, 'get events for transaction')
        return response.data.events.map((eventData) => new Event(eventData))
      },
    }
  }

  private get agreementsClient() {
    return {
      search: async (
        serviceExternalId: string,
        gatewayAccountId: number,
        isLive: boolean,
        page = 1,
        filters?: Record<string, string>
      ) => {
        let path = `/v1/agreement?service_id=${serviceExternalId}&account_id=${gatewayAccountId}&live=${isLive}&page=${page}`
        if (filters && Object.keys(filters).length !== 0) {
          const filterParams = new URLSearchParams(filters).toString()
          path = `${path}&${filterParams}`
        }
        const response = await this.get<SearchData<AgreementData>>(path, 'search agreements')
        return {
          total: response.data.total,
          count: response.data.count,
          page: response.data.page,
          agreements: response.data.results.map((agreementData) => new Agreement(agreementData)),
        }
      },
      get: async (agreementExternalId: string, serviceExternalId: string) => {
        const path = `/v1/agreement/${agreementExternalId}?service_id=${serviceExternalId}`
        const response = await this.get<AgreementData>(path, 'get an agreement')
        return new Agreement(response.data)
      },
    }
  }
}

export default LedgerClient
