import GatewayAccount from '@models/GatewayAccount.class'
import ConnectorClient from '@services/clients/pay/ConnectorClient.class'
import GatewayAccountSwitchPaymentProviderRequest
  from '@models/gateway-account/GatewayAccountSwitchPaymentProviderRequest.class'

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
  return connectorClient.gatewayAccounts.getByServiceExternalIdAndAccountType(
    serviceExternalId,
    accountType
  )
}

async function getGatewayAccountById(gatewayAccountId: number) {
  return connectorClient.gatewayAccounts.getByGatewayAccountId(gatewayAccountId)
}

async function completePspSwitch(serviceExternalId: string, accountType: string, payload: GatewayAccountSwitchPaymentProviderRequest) {
  return connectorClient.gatewayAccounts.switchPSPByServiceExternalIdAndAccountType(
    serviceExternalId,
    accountType,
    payload
  )
}

export {
  getGatewayAccountsByIds,
  getGatewayAccountById,
  getGatewayAccountByServiceExternalIdAndType,
  completePspSwitch
}
