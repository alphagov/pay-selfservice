import { BaseClient } from '@services/clients/base/Client.class'
import ChargeRequest from '@models/charge/ChargeRequest.class'
import { ChargeData } from '@models/charge/dto/Charge.dto'
import ChargeRequestData from '@models/charge/dto/ChargeRequest.dto'
import Charge from '@models/charge/Charge.class'
import GatewayAccount from '@models/gateway-account/GatewayAccount.class'
import { GatewayAccountData } from '@models/gateway-account/dto/GatewayAccount.dto'
import StripeAccountSetup from '@models/StripeAccountSetup.class'
import StripeAccountSetupData from '@models/gateway-account/dto/StripeAccountSetup.dto'
import GatewayAccountSwitchPaymentProviderRequest from '@models/gateway-account/GatewayAccountSwitchPaymentProviderRequest.class'
import { GatewayAccountSwitchPaymentProviderRequestData } from '@models/gateway-account/dto/GatewayAccountSwitchPaymentProviderRequest.dto'
import { AgreementCancelRequest } from '@models/agreements/AgreementCancelRequest.class'
import { AgreementCancelRequestData } from '@models/agreements/dto/AgreementCancelRequest.dto'
import { CardTypeData } from '@models/card-type/dto/CardType.dto'
import { CardType } from '@models/card-type/CardType.class'
import { UpdateAcceptedCardTypesRequestData } from '@models/card-type/dto/UpdateAcceptedCardTypesRequest.dto'
import { UpdateAcceptedCardTypesRequest } from '@models/card-type/UpdateAcceptedCardTypesRequest.class'

const SERVICE_NAME = 'connector'
const SERVICE_BASE_URL = process.env.CONNECTOR_URL!

class ConnectorClient extends BaseClient {
  public charges
  public gatewayAccounts
  public agreements
  public cardTypes

  constructor() {
    super(SERVICE_BASE_URL, SERVICE_NAME)
    this.charges = this.chargesClient
    this.gatewayAccounts = this.gatewayAccountsClient
    this.agreements = this.agreementClient
    this.cardTypes = this.cardTypesClient
  }

  private get agreementClient() {
    return {
      cancel: async (
        serviceExternalId: string,
        accountType: string,
        agreementExternalId: string,
        request: AgreementCancelRequest
      ) => {
        const path = '/v1/api/service/{serviceExternalId}/account/{accountType}/agreements/{agreementExternalId}/cancel'
          .replace('{serviceExternalId}', encodeURIComponent(serviceExternalId))
          .replace('{accountType}', encodeURIComponent(accountType))
          .replace('{agreementExternalId}', encodeURIComponent(agreementExternalId))
        await this.post<AgreementCancelRequestData, null>(path, request.toPayload(), 'cancel an agreement')
      },
    }
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
      findByGatewayAccountIds: async (gatewayAccountIds: number[]) => {
        const path = '/v1/api/accounts?accountIds={gatewayAccountIds}'.replace(
          '{gatewayAccountIds}',
          encodeURIComponent(gatewayAccountIds.join(','))
        )
        const response = await this.get<{ accounts: GatewayAccountData[] }>(path, 'get gateway accounts')
        return response.data
      },

      getByGatewayAccountId: async (gatewayAccountId: number) => {
        const path = '/v1/api/accounts/{gatewayAccountId}'.replace(
          '{gatewayAccountId}',
          encodeURIComponent(gatewayAccountId)
        )
        const response = await this.get<GatewayAccountData>(path, 'get a gateway account')
        return new GatewayAccount(response.data)
      },

      getByServiceExternalIdAndAccountType: async (serviceExternalId: string, accountType: string) => {
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
        const path = '/v1/api/service/{serviceExternalId}/account/{accountType}/stripe-setup'
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
        >(path, body, 'set stripe account onboarding step to done')
      },

      switchPSPByServiceExternalIdAndAccountType: async (
        serviceExternalId: string,
        accountType: string,
        gatewayAccountSwitchProviderRequest: GatewayAccountSwitchPaymentProviderRequest
      ) => {
        const path = '/v1/api/service/{serviceExternalId}/account/{accountType}/switch-psp'
          .replace('{serviceExternalId}', encodeURIComponent(serviceExternalId))
          .replace('{accountType}', encodeURIComponent(accountType))
        await this.post<GatewayAccountSwitchPaymentProviderRequestData, void>(
          path,
          gatewayAccountSwitchProviderRequest.toPayload(),
          'switch gateway account PSP'
        )
      },
    }
  }

  private get cardTypesClient() {
    return {
      getAll: async () => {
        const path = `/v1/api/card-types`
        const response = await this.get<{ card_types: CardTypeData[] }>(path, 'get all card types')
        return response.data.card_types.map((cardTypeData) => new CardType(cardTypeData))
      },

      getAcceptedCardTypesByServiceAndAccountType: async (serviceExternalId: string, accountType: string) => {
        const path = '/v1/frontend/service/{serviceExternalId}/account/{accountType}/card-types'
          .replace('{serviceExternalId}', encodeURIComponent(serviceExternalId))
          .replace('{accountType}', encodeURIComponent(accountType))

        const response = await this.get<{ card_types: CardTypeData[] }>(path, 'get accepted card types for account')
        return response.data.card_types.map((cardTypeData) => new CardType(cardTypeData))
      },

      updateAcceptedCardsForServiceAndAccountType: async (
        serviceExternalId: string,
        accountType: string,
        updateCardTypesRequest: UpdateAcceptedCardTypesRequest
      ) => {
        const path = '/v1/frontend/service/{serviceExternalId}/account/{accountType}/card-types'
          .replace('{serviceExternalId}', encodeURIComponent(serviceExternalId))
          .replace('{accountType}', encodeURIComponent(accountType))

        await this.post<UpdateAcceptedCardTypesRequestData, void>(
          path,
          updateCardTypesRequest.toJson(),
          'update accepted card types for account'
        )
      },
    }
  }
}

export = ConnectorClient
