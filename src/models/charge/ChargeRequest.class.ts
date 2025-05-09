import ChargeRequestData from '@models/charge/dto/ChargeRequest.dto'

class ChargeRequest {
  public amount!: number
  public description!: string
  public reference!: string
  public returnUrl!: string
  public credentialExternalId?: string
  public moto?: boolean

  withAmount(amount: number) {
    this.amount = amount
    return this
  }

  withDescription(description: string) {
    this.description = description
    return this
  }

  withReference(reference: string) {
    this.reference = reference
    return this
  }

  withReturnUrl(returnUrl: string) {
    this.returnUrl = returnUrl
    return this
  }

  withCredentialExternalId(credentialExternalId: string) {
    this.credentialExternalId = credentialExternalId
    return this
  }

  withMoto(moto: boolean) {
    this.moto = moto
    return this
  }

  toPayload(): ChargeRequestData {
    return {
      amount: this.amount,
      description: this.description,
      reference: this.reference,
      return_url: this.returnUrl,
      credential_id: this.credentialExternalId,
      moto: this.moto ?? false,
    }
  }
}

export = ChargeRequest
