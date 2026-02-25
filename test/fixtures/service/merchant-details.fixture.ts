import { MerchantDetailsData } from '@models/service/dto/Service.dto'

export class MerchantDetailsFixture {
  readonly name: string
  readonly telephoneNumber: string
  readonly addressLine1: string
  readonly addressLine2: string
  readonly addressCity: string
  readonly addressPostcode: string
  readonly addressCountry: string
  readonly url: string
  readonly email: string

  constructor(overrides?: Partial<MerchantDetailsFixture>) {
    this.name = 'Compu-Global-Hyper-Meganet'
    this.telephoneNumber = ''
    this.addressLine1 = '742 Evergreen Terrace'
    this.addressLine2 = ''
    this.addressCity = 'Springfield'
    this.addressPostcode = 'SP21NG'
    this.addressCountry = 'US'
    this.url = 'cghmn.example.com'
    this.email = 'admin@cghmn.example.com'

    if (overrides) {
      Object.assign(this, overrides)
    }
  }

  toMerchantDetailsData(): MerchantDetailsData {
    return {
      name: this.name,
      telephone_number: this.telephoneNumber,
      address_line1: this.addressLine1,
      address_line2: this.addressLine2,
      address_city: this.addressCity,
      address_postcode: this.addressPostcode,
      address_country: this.addressCountry,
      url: this.url,
      email: this.email,
    }
  }
}
