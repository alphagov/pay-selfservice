import { GatewayAccountFixture } from '@test/fixtures/gateway-account/gateway-account.fixture'
import { stubBuilder } from '@test/cypress/stubs/stub-builder'

export function searchByServiceExternalIds(serviceExternalIds: string[]) {
  const path = `/v1/api/accounts`

  return {
    success: function (gatewayAccounts: GatewayAccountFixture[]) {
      return stubBuilder('GET', path, 200, {
        query: {
          serviceIds: serviceExternalIds,
        },
        response: {
          accounts: gatewayAccounts.map((account) => account.toGatewayAccountData()),
        },
      })
    },
  }
}
