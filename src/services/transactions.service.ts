import LedgerClient from '@services/clients/pay/LedgerClient.class'
import { LedgerTransactionParams, LedgerTransactionParamsData } from '@services/clients/pay/interfaces/ledger-client'

const ledgerClient = new LedgerClient()

const searchTransactions = async (gatewayAccountId: number, currentPage: number, pageSize: number) => {
  const queryParams: LedgerTransactionParams = {
    accountIds: [gatewayAccountId],
    displaySize: pageSize,
    page: currentPage,
  }
  return await ledgerClient.transactions(new LedgerTransactionParamsData(queryParams))
}

export { searchTransactions }
