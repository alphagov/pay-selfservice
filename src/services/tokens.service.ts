import {PublicAuthClient} from '@services/clients/pay/PublicAuthClient.class'
import { CreateTokenRequest } from '@models/public-auth/CreateTokenRequest.class'
import TokenUsageType from '@models/public-auth/token-usage-type'

const publicAuthClient = new PublicAuthClient()

const createDemoPaymentToken = async (gatewayAccountId: number, serviceExternalId: string, serviceMode: string, userEmail: string) => {
  const response = await publicAuthClient.tokens.create(new CreateTokenRequest()
    .withGatewayAccountId(gatewayAccountId)
    .withServiceExternalId(serviceExternalId)
    .withServiceMode(serviceMode)
    .withDescription('Token for Demo Payment')
    .withCreatedBy(userEmail)
    .withTokenUsageType(TokenUsageType.PRODUCTS))
  return response.token
}

export {
  createDemoPaymentToken
}
