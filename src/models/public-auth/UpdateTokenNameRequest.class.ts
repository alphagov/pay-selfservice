import { UpdateTokenNameRequestData } from '@models/public-auth/dto/UpdateTokenNameRequest.dto'

export class UpdateTokenNameRequest {
  tokenLink!: string
  name!: string

  withTokenLink(tokenLink: string) {
    this.tokenLink = tokenLink
    return this
  }

  withName(name: string) {
    this.name = name
    return this
  }

  toJson(): UpdateTokenNameRequestData {
    return {
      payload: {
        token_link: this.tokenLink,
        description: this.name,
      },
    }
  }
}
