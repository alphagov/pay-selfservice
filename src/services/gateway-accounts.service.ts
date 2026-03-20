import GatewayAccount from '@models/gateway-account/GatewayAccount.class'
import ConnectorClient from '@services/clients/pay/ConnectorClient.class'
import GatewayAccountSwitchPaymentProviderRequest from '@models/gateway-account/GatewayAccountSwitchPaymentProviderRequest.class'
import { GatewayAccountSearchParams } from '@models/gateway-account/GatewayAccountSearchParams.class'

const connectorClient = new ConnectorClient()

async function getGatewayAccountsByIds(gatewayAccountIds: number[]) {
  const gatewayAccounts = await connectorClient.gatewayAccounts.findByGatewayAccountIds(gatewayAccountIds)

  return gatewayAccounts.accounts.reduce<Record<number, GatewayAccount>>((acc, gatewayAccountData) => {
    const account = new GatewayAccount(gatewayAccountData)
    acc[account.id] = account
    return acc
  }, {})
}

async function getGatewayAccountByServiceExternalIdAndType(serviceExternalId: string, accountType: string) {
  return connectorClient.gatewayAccounts.getByServiceExternalIdAndAccountType(serviceExternalId, accountType)
}

async function getGatewayAccountById(gatewayAccountId: number) {
  return connectorClient.gatewayAccounts.getByGatewayAccountId(gatewayAccountId)
}

async function completePaymentServiceProviderSwitch(
  serviceExternalId: string,
  accountType: string,
  payload: GatewayAccountSwitchPaymentProviderRequest
) {
  return connectorClient.gatewayAccounts.switchPSPByServiceExternalIdAndAccountType(
    serviceExternalId,
    accountType,
    payload
  )
}

async function findGatewayAccountsByService(serviceExternalIds: string | string[], gatewayAccountType?: string) {
  const serviceIds = Array.isArray(serviceExternalIds) ? serviceExternalIds : [serviceExternalIds]

  const gatewayAccountSearchParams = new GatewayAccountSearchParams().withServiceExternalIds(serviceIds)
  if (gatewayAccountType) {
    gatewayAccountSearchParams.withGatewayAccountType(gatewayAccountType)
  }

  return connectorClient.gatewayAccounts.search(gatewayAccountSearchParams)
}

export {
  getGatewayAccountsByIds,
  getGatewayAccountById,
  getGatewayAccountByServiceExternalIdAndType,
  completePaymentServiceProviderSwitch,
  findGatewayAccountsByService,
}
