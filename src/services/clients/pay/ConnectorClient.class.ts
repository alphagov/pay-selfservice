import { BaseClient } from '@services/clients/base/Client.class'
import ChargeRequest from '@models/charge/ChargeRequest.class'
import { ChargeData } from '@models/charge/dto/Charge.dto'
import ChargeRequestData from '@models/charge/dto/ChargeRequest.dto'
import Charge from '@models/charge/Charge.class'
import GatewayAccount from '@models/GatewayAccount.class'
import { GatewayAccountData } from '@models/gateway-account/dto/GatewayAccount.dto'
import StripeAccountSetup from '@models/StripeAccountSetup.class'
import StripeAccountSetupData from '@models/gateway-account/dto/StripeAccountSetup.dto'

const SERVICE_NAME = 'connector'
const SERVICE_BASE_URL = process.env.CONNECTOR_URL!

class ConnectorClient extends BaseClient {
  public charges
  public gatewayAccounts

  constructor() {
    super(SERVICE_BASE_URL, SERVICE_NAME)
    this.charges = this.chargesClient
    this.gatewayAccounts = this.gatewayAccountsClient
  }

  private get chargesClient() {
    return {
      getChargeByServiceExternalIdAndAccountType: async (
        serviceExternalId: string,
        accountType: string,
        chargeExternalId: string
      ) => {
        const path = '/v1/api/service/{serviceExternalId}/account/{accountType}/charges/{chargeExternalId}'
          .replace('{serviceExternalId}', encodeURIComponent(serviceExternalId))
          .replace('{accountType}', encodeURIComponent(accountType))
          .replace('{chargeExternalId}', encodeURIComponent(chargeExternalId))
        const response = await this.get<ChargeData>(path, 'get a charge')
        return new Charge(response.data)
      },

      postChargeByServiceExternalIdAndAccountType: async (
        serviceExternalId: string,
        accountType: string,
        chargeRequest: ChargeRequest
      ) => {
        const path = '/v1/api/service/{serviceExternalId}/account/{accountType}/charges'
          .replace('{serviceExternalId}', encodeURIComponent(serviceExternalId))
          .replace('{accountType}', encodeURIComponent(accountType))
        const response = await this.post<ChargeRequestData, ChargeData>(
          path,
          chargeRequest.toPayload(),
          'create a charge'
        )
        return new Charge(response.data)
      },
    }
  }

  private get gatewayAccountsClient() {
    return {
      getGatewayAccountByServiceExternalIdAndAccountType: async (serviceExternalId: string, accountType: string) => {
        const path = '/v1/api/service/{serviceExternalId}/account/{accountType}'
          .replace('{serviceExternalId}', encodeURIComponent(serviceExternalId))
          .replace('{accountType}', encodeURIComponent(accountType))
        const response = await this.get<GatewayAccountData>(path, 'get a gateway account')
        return new GatewayAccount(response.data)
      },
      getStripeAccountSetupByServiceExternalIdAndAccountType: async (
        serviceExternalId: string,
        accountType: string
      ) => {
        const path = '/v1/api/service/{serviceExternalId}/account/{accountType}/stripe-setup'
          .replace('{serviceExternalId}', encodeURIComponent(serviceExternalId))
          .replace('{accountType}', encodeURIComponent(accountType))
        const response = await this.get<StripeAccountSetupData>(path, 'get stripe account onboarding progress')
        return new StripeAccountSetup(response.data)
      },
      updateStripeAccountSetupByServiceExternalIdAndAccountType: async (
        serviceExternalId: string,
        accountType: string,
        stripeAccountSetupStep: string
      ) => {
        const url = '/v1/api/service/{serviceExternalId}/account/{accountType}/stripe-setup'
          .replace('{serviceExternalId}', encodeURIComponent(serviceExternalId))
          .replace('{accountType}', encodeURIComponent(accountType))
        const body = [
          {
            op: 'replace',
            path: stripeAccountSetupStep,
            value: true,
          },
        ]
        await this.patch<
          {
            op: string
            path: string
            value: boolean
          }[],
          void
        >(url, body, 'set stripe account onboarding step to done')
      },
    }
  }
}

export = ConnectorClient
