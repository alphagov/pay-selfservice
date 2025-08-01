import { CardDetailsData } from '@models/common/card-details/dto/CardDetails.dto'

class CardDetails {
  readonly cardholderName: string
  readonly billingAddress: {
    line1: string
    line2?: string
    postcode: string
    city: string
    country: string
  }
  readonly cardBrand: string
  readonly lastDigitsCardNumber: string
  readonly firstDigitsCardNumber: string
  readonly expiryDate: string
  readonly cardType: string

  constructor(data: CardDetailsData) {
      this.cardholderName = data.cardholder_name
      this.billingAddress = data.billing_address
      this.cardBrand = data.card_brand
      this.lastDigitsCardNumber = data.last_digits_card_number
      this.firstDigitsCardNumber = data.first_digits_card_number
      this.expiryDate = data.expiry_date
      this.cardType = data.card_type
  }
}

export {
  CardDetails,
}
