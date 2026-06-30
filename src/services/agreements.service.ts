import LedgerClient from '@services/clients/pay/LedgerClient.class'
import ConnectorClient from '@services/clients/pay/ConnectorClient.class'
import GatewayAccountType from '@models/gateway-account/gateway-account-type'
import { AgreementCancelRequest } from '@models/agreements/AgreementCancelRequest.class'
import User from '@models/user/User.class'
import { TransactionSearchParams } from '@models/transaction/TransactionSearchParams.class'

const ledgerClient = new LedgerClient()
const connectorClient = new ConnectorClient()

const searchAgreements = async (
  serviceExternalId: string,
  gatewayAccountId: number,
  serviceMode: string,
  page = 1,
  filters?: Record<string, string>
) => {
  const isLive = serviceMode === GatewayAccountType.LIVE
  return await ledgerClient.agreements.search(serviceExternalId, gatewayAccountId, isLive, page, filters)
}

const getAgreement = async (agreementExternalId: string, serviceExternalId: string) => {
  return await ledgerClient.agreements.get(agreementExternalId, serviceExternalId)
}

const cancelAgreement = async (
  serviceExternalId: string,
  accountType: string,
  agreementExternalId: string,
  actioningUser: User
) => {
  const cancelRequest = new AgreementCancelRequest(actioningUser.email, actioningUser.externalId)
  await connectorClient.agreements.cancel(serviceExternalId, accountType, agreementExternalId, cancelRequest)
}

const getLatestTransactionsForAgreement = async (gatewayAccountId: number, agreementExternalId: string) => {
  return await ledgerClient.transactions.search(
    TransactionSearchParams.forAgreement(gatewayAccountId, agreementExternalId, 1, 5)
  )
}

export { searchAgreements, getAgreement, getLatestTransactionsForAgreement, cancelAgreement }
