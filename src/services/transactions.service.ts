import LedgerClient from '@services/clients/pay/LedgerClient.class'
import { LedgerTransactionParams, LedgerTransactionParamsData } from '@services/clients/pay/interfaces/ledger-client'

const ledgerClient = new LedgerClient()

const searchTransactions = async (gatewayAccountId: number) => {
  const queryParams: LedgerTransactionParams = {
    accountIds: [gatewayAccountId],
    displaySize: 5
  }
  return await ledgerClient.transactions(new LedgerTransactionParamsData(queryParams))
}

export { searchTransactions }