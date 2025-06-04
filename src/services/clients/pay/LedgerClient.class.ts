import { BaseClient } from '@services/clients/base/Client.class'
import { TransactionSummary } from '@models/ledger/TransactionSummary.class'
import { TransactionSummaryData } from '@models/ledger/dto/TransactionSummary.dto'

const SERVICE_NAME = 'ledger'
const SERVICE_BASE_URL = process.env.LEDGER_URL!

class LedgerClient extends BaseClient {
  constructor() {
    super(SERVICE_BASE_URL, SERVICE_NAME)
  }

  async transactionSummary(gatewayAccountId: number, fromDate: string, toDate: string) {
    const path = '/v1/report/transactions-summary?account_id={gatewayAccountId}&from_date={fromDate}&to_date={toDate}'
      .replace('{gatewayAccountId}', encodeURIComponent(gatewayAccountId))
      .replace('{fromDate}', encodeURIComponent(fromDate))
      .replace('{toDate}', encodeURIComponent(toDate))

    const response = await this.get<TransactionSummaryData>(path, 'get transaction summary')
    return new TransactionSummary(response.data)
  }
}

export = LedgerClient
