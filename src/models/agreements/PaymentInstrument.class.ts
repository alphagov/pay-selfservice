import { PaymentInstrumentData } from '@models/agreements/dto/PaymentInstrument.dto'
import { DateTime } from 'luxon'

class PaymentInstrument {
  readonly externalId: string
  readonly agreementExternalId: string
  readonly cardDetails: {
    cardholderName: string
    billingAddress: {
      line1: string
      line2?: string
      postcode: string
      city: string
      country: string
    }
    cardBrand: string
    lastDigitsCardNumber: string
    firstDigitsCardNumber: string
    expiryDate: string
    cardType: string
  }
  readonly type: string
  readonly createdDate: DateTime

  constructor(data: PaymentInstrumentData) {
    this.externalId = data.external_id
    this.agreementExternalId = data.agreement_external_id
    this.cardDetails = {
      cardholderName: data.card_details.cardholder_name,
      billingAddress: data.card_details.billing_address,
      cardBrand: data.card_details.card_brand,
      lastDigitsCardNumber: data.card_details.last_digits_card_number,
      firstDigitsCardNumber: data.card_details.first_digits_card_number,
      expiryDate: data.card_details.expiry_date,
      cardType: data.card_details.card_type
    }
    this.type = data.type
    this.createdDate = DateTime.fromISO(data.created_date)
  }
}

export {
  PaymentInstrument
}
