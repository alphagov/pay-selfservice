import { BaseClient } from '@services/clients/base/Client.class'
import { TransactionSummary } from '@models/ledger/TransactionSummary.class'
import { TransactionSummaryData } from '@models/ledger/dto/TransactionSummary.dto'
import { AgreementsSearchData } from '@models/agreements/dto/AgreementSearch.dto'
import { Agreement } from '@models/agreements/Agreement.class'

const SERVICE_NAME = 'ledger'
const SERVICE_BASE_URL = process.env.LEDGER_URL!

class LedgerClient extends BaseClient {
  public agreements

  constructor() {
    super(SERVICE_BASE_URL, SERVICE_NAME)
    this.agreements = this.agreementsClient
  }

  async transactionSummary(gatewayAccountId: number, fromDate: string, toDate: string) {
    const path = '/v1/report/transactions-summary?account_id={gatewayAccountId}&from_date={fromDate}&to_date={toDate}'
      .replace('{gatewayAccountId}', encodeURIComponent(gatewayAccountId))
      .replace('{fromDate}', encodeURIComponent(fromDate))
      .replace('{toDate}', encodeURIComponent(toDate))

    const response = await this.get<TransactionSummaryData>(path, 'get transaction summary')
    return new TransactionSummary(response.data)
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
        if (filters) {
          const filterParams = new URLSearchParams(filters).toString()
          path = `${path}&${filterParams}`
        }
        const response = await this.get<AgreementsSearchData>(path, 'search agreements')
        return {
          total: response.data.total,
          count: response.data.count,
          page: response.data.page,
          agreements: response.data.results.map((agreementData) => new Agreement(agreementData)),
        }
      }
    }
  }
}

export default LedgerClient
