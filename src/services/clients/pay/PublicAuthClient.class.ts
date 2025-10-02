import { BaseClient } from '@services/clients/base/Client.class'
import { CreateTokenRequest } from '@models/public-auth/CreateTokenRequest.class'
import { CreateTokenRequestData } from '@models/public-auth/dto/CreateTokenRequest.dto'
import { Token } from '@models/public-auth/Token.class'
import { TokenData } from '@models/public-auth/dto/Token.dto'
import { UpdateTokenNameRequestData } from '@models/public-auth/dto/UpdateTokenNameRequest.dto'
import { UpdateTokenNameRequest } from '@models/public-auth/UpdateTokenNameRequest.class'

const SERVICE_NAME = 'publicauth'
const SERVICE_BASE_URL = process.env.PUBLIC_AUTH_URL!

class PublicAuthClient extends BaseClient {
  public tokens
  constructor() {
    super(SERVICE_BASE_URL, SERVICE_NAME)
    this.tokens = this.tokensClient
  }

  private get tokensClient() {
    return {
      create: async (createTokenRequest: CreateTokenRequest) => {
        const response = await this.post<CreateTokenRequestData, { token: string }>(
          '',
          createTokenRequest.toPayload(),
          'create a token'
        )
        return response.data
      },

      getActive: async (gatewayAccountId: string) => {
        const path = '/{gatewayAccountId}'.replace('{gatewayAccountId}', encodeURIComponent(gatewayAccountId))

        const response = await this.get<TokenData[]>(path, 'get active tokens for account')
        return response.data.map((tokenData) => new Token(tokenData))
      },

      getRevoked: async (gatewayAccountId: string) => {
        const path = '/{gatewayAccountId}'.replace('{gatewayAccountId}', encodeURIComponent(gatewayAccountId))

        const response = await this.get<TokenData[]>(path, 'get revoked tokens for account', {
          params: {
            state: 'revoked',
          },
        })
        return response.data.map((tokenData) => new Token(tokenData))
      },

      getByTokenLink: async (gatewayAccountId: number, tokenLink: string) => {
        const path = '/{gatewayAccountId}/{tokenLink}'
          .replace('{gatewayAccountId}', encodeURIComponent(gatewayAccountId))
          .replace('{tokenLink}', encodeURIComponent(tokenLink))

        const response = await this.get<TokenData>(path, 'get token by gateway account ID and token link')
        return new Token(response.data)
      },

      updateName: async (updateRequest: UpdateTokenNameRequest) => {
        const response = await this.put<UpdateTokenNameRequestData, TokenData>(
          '',
          updateRequest.toJson(),
          'update token name'
        )
        return new Token(response.data)
      },
    }
  }
}

export default PublicAuthClient
