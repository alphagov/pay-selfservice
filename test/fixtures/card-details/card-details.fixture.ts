import { CardDetailsData } from '@models/common/card-details/dto/CardDetails.dto'

export class CardDetailsFixture {
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

  constructor(options?: Partial<CardDetailsFixture>) {
    this.cardholderName = 'Homer J Simpson'
    this.billingAddress = {
      line1: '742 Evergreen Terrace',
      city: 'Springfield',
      postcode: 'SP21NG',
      country: 'United States',
    }
    this.cardBrand = 'Visa'
    this.firstDigitsCardNumber = '444433'
    this.lastDigitsCardNumber = '1111'
    this.expiryDate = '12/99'
    this.cardType = 'DEBIT'

    if (options) {
      Object.assign(this, options)
    }
  }

  toCardDetailsData(): CardDetailsData {
    return {
      cardholder_name: this.cardholderName,
      billing_address: {
        line1: this.billingAddress.line1,
        line2: this.billingAddress.line2,
        city: this.billingAddress.city,
        country: this.billingAddress.country,
        postcode: this.billingAddress.postcode,
      },
      card_brand: this.cardBrand,
      first_digits_card_number: this.firstDigitsCardNumber,
      last_digits_card_number: this.lastDigitsCardNumber,
      expiry_date: this.expiryDate,
      card_type: this.cardType,
    }
  }
}
