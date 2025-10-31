import { ChargeRefundRequestData } from '@models/charge/dto/ChargeRefundRequest.dto'

export class ChargeRefundRequest {
  public amount!: number
  public refundAmountAvailable!: number
  public userExternalId!: string
  public userEmail!: string

  withAmount(amount: number) {
    this.amount = amount
    return this
  }

  withRefundAmountAvailable(refundAmountAvailable: number) {
    this.refundAmountAvailable = refundAmountAvailable
    return this
  }

  withUserExternalId(userExternalId: string) {
    this.userExternalId = userExternalId
    return this
  }

  withUserEmail(userEmail: string) {
    this.userEmail = userEmail
    return this
  }

  toJson(): ChargeRefundRequestData {
    return {
      amount: this.amount,
      refund_amount_available: this.refundAmountAvailable,
      user_external_id: this.userExternalId,
      user_email: this.userEmail,
    }
  }
}
