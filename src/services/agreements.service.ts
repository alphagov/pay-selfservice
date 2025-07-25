import LedgerClient from '@services/clients/pay/LedgerClient.class'
import GatewayAccountType from '@models/gateway-account/gateway-account-type'

const ledgerClient = new LedgerClient()

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

export { searchAgreements }
