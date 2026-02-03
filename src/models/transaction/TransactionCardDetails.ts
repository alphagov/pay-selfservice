import { CardDetailsData } from '@models/common/card-details/dto/CardDetails.dto'

class TransactionCardDetails {
  readonly cardBrand: string

  constructor(data: CardDetailsData) {
    this.cardBrand = data.card_brand
  }

  static fromJson(data: CardDetailsData) {
    return new TransactionCardDetails(data)
  }
}

export { TransactionCardDetails }
