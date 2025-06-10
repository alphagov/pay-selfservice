import { BaseClient } from '@services/clients/base/Client.class'
import { CreateTokenRequest } from '@models/public-auth/CreateTokenRequest.class'
import { CreateTokenRequestData } from '@models/public-auth/dto/CreateTokenRequest.dto'

const SERVICE_NAME = 'publicauth'
const SERVICE_BASE_URL = process.env.PUBLIC_AUTH_URL!

export class PublicAuthClient extends BaseClient {
  public tokens
  constructor() {
    super(SERVICE_BASE_URL, SERVICE_NAME)
    this.tokens = this.tokensClient
  }

  private get tokensClient() {
    return {
      create: async (createTokenRequest: CreateTokenRequest) => {
        const response = await this.post<CreateTokenRequestData, { token: string }>('', createTokenRequest.toPayload(), 'create a token')
        return response.data
      }
    }
  }
}
