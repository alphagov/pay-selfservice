import PublicAuthClient from '@services/clients/pay/PublicAuthClient.class'
import { CreateTokenRequest } from '@models/public-auth/CreateTokenRequest.class'
import TokenUsageType from '@models/public-auth/token-usage-type'
import { UpdateTokenNameRequest } from '@models/public-auth/UpdateTokenNameRequest.class'

const publicAuthClient = new PublicAuthClient()

const createDemoPaymentToken = async (
  gatewayAccountId: number,
  serviceExternalId: string,
  serviceMode: string,
  userEmail: string
) => {
  const response = await publicAuthClient.tokens.create(
    new CreateTokenRequest()
      .withGatewayAccountId(`${gatewayAccountId}`)
      .withServiceExternalId(serviceExternalId)
      .withServiceMode(serviceMode)
      .withDescription('Token for Demo Payment')
      .withCreatedBy(userEmail)
      .withTokenUsageType(TokenUsageType.PRODUCTS)
  )
  return response.token
}

const createPaymentLinkToken = async (
  gatewayAccountId: number,
  serviceExternalId: string,
  serviceMode: string,
  userEmail: string
) => {
  const response = await publicAuthClient.tokens.create(
    new CreateTokenRequest()
      .withGatewayAccountId(`${gatewayAccountId}`)
      .withServiceExternalId(serviceExternalId)
      .withServiceMode(serviceMode)
      .withDescription('Token for Payment Link creation')
      .withCreatedBy(userEmail)
      .withTokenUsageType(TokenUsageType.PRODUCTS)
  )
  return response.token
}

async function createToken(createTokenRequest: CreateTokenRequest) {
  const response = await publicAuthClient.tokens.create(createTokenRequest)
  return response.token
}

async function getActiveTokens(gatewayAccountId: string) {
  return publicAuthClient.tokens.getActive(gatewayAccountId)
}

async function getRevokedTokens(gatewayAccountId: string) {
  return publicAuthClient.tokens.getRevoked(gatewayAccountId)
}

async function getTokenByTokenLink(gatewayAccountId: number, tokenLink: string) {
  return publicAuthClient.tokens.getByTokenLink(gatewayAccountId, tokenLink)
}

async function changeTokenName(tokenLink: string, name: string) {
  const updateTokenNameRequest = new UpdateTokenNameRequest().withTokenLink(tokenLink).withName(name)
  return publicAuthClient.tokens.updateName(updateTokenNameRequest)
}

export {
  createDemoPaymentToken,
  createPaymentLinkToken,
  createToken,
  getActiveTokens,
  getRevokedTokens,
  getTokenByTokenLink,
  changeTokenName,
}
