import { AgreementCancelRequestData } from '@models/agreements/dto/AgreementCancelRequest.dto'

class AgreementCancelRequest {
  readonly userEmail: string
  readonly userExternalId: string

  constructor(userEmail: string, userExternalId: string) {
    this.userEmail = userEmail
    this.userExternalId = userExternalId
  }

  toPayload(): AgreementCancelRequestData {
    return {
      user_email: this.userEmail,
      user_external_id: this.userExternalId
    }
  }
}

export {
  AgreementCancelRequest
}
